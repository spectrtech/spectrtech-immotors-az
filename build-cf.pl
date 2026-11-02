#!/usr/bin/perl
# Собирает сайт для Cloudflare в deploy/: Worker редактора SpectrTech (cms/kit/backend/worker.js) + статика deploy/public.
# Источник — страницы из build.sh (index.html, l7.html … 404.html в корне проекта):
#  - фото: адреса portal-static / im-cdn / i.ytimg / photos/ → копии с Tilda CDN (tilda-import/cdn-map.tsv),
#    скачиваются один раз в public/img/ (имя = 8 знаков id Tilda + имя файла — не меняется между сборками);
#  - тексты: каждой тройке <span data-l="az|ru|en"> — ключ data-i18n-html для редактора (см. cms/imx-cms.js);
#  - SEO: canonical, og/twitter, favicon, JSON-LD, sitemap.xml, robots.txt; _redirects (301 со старых адресов), _headers;
#  - редактор: mainedit.html, assets/st-*.js|css (cms/kit, версия в cms/kit/VERSION), st-config.js, content/site.js (пустой).
# Запуск: bash build.sh && perl build-cf.pl
use strict; use warnings;
use Digest::MD5 qw(md5_hex);
use File::Path qw(make_path);
use File::Copy qw(copy);
use POSIX qw(strftime);
chdir(((__FILE__ =~ m{^(.*)[/\\]}) ? $1 : '.'));

my $SITE = 'https://immotors.az';
my $OUT = 'deploy'; my $PUB = "$OUT/public";
sub slurp { my $f = shift; open my $h, '<:raw', $f or die "$f: $!"; local $/; my $s = <$h>; close $h; $s }
sub spit  { my ($f, $s) = @_; my ($d) = $f =~ m{^(.*)/}; make_path($d) if $d; open my $h, '>:raw', $f or die "$f: $!"; print $h $s; close $h }

# страницы: id для редактора, собранный файл, адрес, название в редакторе (az, ru, en)
my @PAGES = (
  ['index', 'index.html', '/', 'Ana səhifə (başlıq, CTA və alt hissə — bütün səhifələr üçün)', 'Главная (шапка, CTA и подвал — для всех страниц)', 'Home (header, CTA and footer — all pages)'],
  (map { my $u = uc; ["$_", "$_.html", "/$_", "IM $u", "IM $u", "IM $u"] } qw(l7 ls7 l6 ls6 ls9 ls8)),
  ['testdrive', 'testdrive.html', '/testdrive', 'Test sürüşü', 'Тест-драйв', 'Test drive'],
  ['office', 'office.html', '/office', 'Salon və əlaqə', 'Салон и контакты', 'Showroom & contact'],
  ['privacy', 'privacy.html', '/privacy', 'Məxfilik siyasəti', 'Политика конфиденциальности', 'Privacy policy'],
  ['terms', 'terms.html', '/terms', 'İstifadə şərtləri', 'Условия использования', 'Terms of use'],
  ['404', '404.html', '/404', 'Səhifə tapılmadı (404)', 'Страница не найдена (404)', 'Page not found (404)'],
);

# ── фото: исходный адрес → копия на Tilda CDN → public/img/<имя> ──
my %MAP; for (split /\n/, slurp('tilda-import/cdn-map.tsv')) { my ($a, $b) = split /\t/; $MAP{$a} = $b if $a && $b }
my $ext = qr{(?:https://(?:portal-static\.immotors\.com|im-cdn\.immotors\.com|i\.ytimg\.com)/[^"' )\\<>]+|photos/[A-Za-z0-9._-]+\.(?:jpg|jpeg|png|webp))};
my (%img, %imgsrc);   # имя → адрес на CDN
sub imgname { my $u = shift; my ($id, $base) = $u =~ m{/tila([0-9a-f]{4})-([0-9a-f]{4})-[^/]+/([^/?#]+)$} ? ("$1$2", $3) : die "не похоже на адрес Tilda CDN: $u"; $base =~ s/[^A-Za-z0-9._-]/_/g; "$id-$base" }
sub mapimg {
  my $u = shift; (my $k = $u) =~ s{&amp;}{&}g;
  my $cdn = $MAP{$k} or die "нет копии на Tilda CDN для $k (tilda-import/cdn-map.tsv)\n";
  my $n = imgname($cdn); die "одно имя для разных фото: $n\n" if $imgsrc{$n} && $imgsrc{$n} ne $cdn;
  $imgsrc{$n} = $cdn; "/img/$n";
}

# ── ключи текстов для редактора ──
my $TRI = qr{
  <span\ data-l="az">(?<az>(?&in))</span>\s*
  <span\ data-l="ru">(?<ru>(?&in))</span>\s*
  <span\ data-l="en">(?<en>(?&in))</span>
  (?(DEFINE)
    (?<in>(?:[^<]++|<(?!/?span\b)[^>]*+>|(?&sp))*+)
    (?<sp><span\b[^>]*+>(?&in)</span>)
  )
}x;
my %keytext;   # ключ → тексты (проверка совпадения хешей)
sub keyed {
  my $s = shift; my @rep;
  while ($s =~ /$TRI/g) {
    my ($a, $b, $az, $ru, $en) = ($-[0], $+[0], $+{az}, $+{ru}, $+{en});
    my $all = "$az\x1f$ru\x1f$en"; my $k = 't' . substr(md5_hex($all), 0, 8);
    die "один ключ $k для разных текстов\n" if exists $keytext{$k} && $keytext{$k} ne $all;
    $keytext{$k} = $all;
    # родитель, у которого тройка — единственное содержимое: ключ ставим ему, иначе оборачиваем тройку в <span>
    my $from = $a > 300 ? $a - 300 : 0; my $before = substr($s, $from, $a - $from);
    my ($tag, $attrs, $at);
    if ($before =~ /<([a-z][a-z0-9]*)\b([^<>]*)>\s*\z/) { ($tag, $attrs, $at) = ($1, $2, $from + $-[2] + length $2) }
    if ($tag && $attrs !~ /data-i18n-html/ && $attrs !~ m{/\s*\z} && substr($s, $b, 40) =~ /\A\s*<\/\Q$tag\E>/) {
      push @rep, [$at, 0, qq( data-i18n-html="$k")];   # $at — место перед «>» открывающего тега
    } else {
      push @rep, [$a, 0, qq(<span data-i18n-html="$k">)], [$b, 1, '</span>'];
    }
  }
  # с конца, чтобы не сдвигать позиции; на одном месте сначала открытие следующей тройки, потом закрытие предыдущей
  for my $r (sort { $b->[0] <=> $a->[0] || $a->[1] <=> $b->[1] } @rep) { substr($s, $r->[0], 0) = $r->[2] }
  $s;
}

# ── favicon из знака в логотипе подвала ──
my ($MARK) = slurp('blocks/10-footer.html') =~ m{<path fill-rule="evenodd" d="([^"]+)"} or die 'нет знака логотипа в 10-footer.html';
my $FAVICON = qq(<svg xmlns="http://www.w3.org/2000/svg" viewBox="42 300 300 300"><rect x="42" y="300" width="300" height="300" rx="64" fill="#0a0a0b"/><path fill="#f4f2ee" fill-rule="evenodd" d="$MARK"/></svg>\n);

my $date = strftime('%Y-%m-%d', localtime);
my $ld = sub { my $og = shift; '<script type="application/ld+json">' . join('', '{"@context":"https://schema.org","@type":"AutoDealer","name":"IM Motors Azərbaycan — ONVOLT","url":"', $SITE, '/",',
  '"image":"', $og, '","telephone":["+994994400007","+994124400007"],"email":"sales@onvolt.az",',
  '"address":{"@type":"PostalAddress","streetAddress":"Ceyhun Hacıbəyli 194","addressLocality":"Bakı","addressCountry":"AZ"},',
  '"brand":{"@type":"Brand","name":"IM Motors"},"sameAs":["https://instagram.com/immotors.azerbaijan","https://facebook.com/immotors.az","https://tiktok.com/@immotors.az"]}') . '</script>' };

make_path("$PUB/img", "$PUB/assets", "$PUB/content");
my (%seenpage, $ogdefault);
for my $p (@PAGES) {
  my ($id, $file, $path) = @$p;
  my $h = slurp($file);
  # пример данных turbo.az и правила редактора Tilda — только для локального превью и Tilda
  $h =~ s{<script>window\.IMX_STOCK_SAMPLE=.*?;</script>\s*}{}s or die "$file: нет IMX_STOCK_SAMPLE";
  $h =~ s{^[ \t]*/\* редактор Tilda[^\n]*\n}{}mg;
  $h =~ s{^[ \t]*#allrecords\[data-tilda-mode="edit"\][^\n]*\n}{}mg;
  $h =~ s{<link rel="preconnect" href="https://portal-static\.immotors\.com" />\n?}{};   # фото теперь со своего домена
  # фото
  $h =~ s/($ext)/mapimg($1)/ge;
  # разметка вне <script>/<style>: без HTML-комментариев (инструкции для Tilda), с ключами текстов
  $h = join '', map { /^<(?:script|style)\b/ ? $_ : keyed(s/<!--.*?-->\s*//sgr) } split m{(<script\b.*?</script>|<style\b.*?</style>)}s, $h;
  # кнопки языков — как ждёт редактор (.lang button[data-lang])
  $h =~ s{<button data-imx-setlang="(\w+)">}{<button data-imx-setlang="$1" data-lang="$1">}g;
  $h =~ s{class="imx-lang"}{class="imx-lang lang"}g;
  # SEO в <head>
  my ($title) = $h =~ m{<title>([^<]*)</title>} or die "$file: нет <title>";
  my ($desc) = $h =~ m{<meta name="description" content="([^"]*)"} or die "$file: нет description";
  my ($og) = $h =~ m{<img\b[^>]*\bsrc="(/img/[^"]+)"};
  $ogdefault //= $og; $og = $SITE . ($og // $ogdefault);
  my $url = $SITE . $path;
  my $head = join "\n", '',
    ($id eq '404' ? '<meta name="robots" content="noindex" />' : qq(<link rel="canonical" href="$url" />)),
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml" />',
    '<meta name="theme-color" content="#0a0a0b" />',
    qq(<meta property="og:type" content="website" />),
    qq(<meta property="og:site_name" content="IM Motors Azərbaycan" />),
    qq(<meta property="og:title" content="$title" />),
    qq(<meta property="og:description" content="$desc" />),
    qq(<meta property="og:url" content="$url" />),
    qq(<meta property="og:image" content="$og" />),
    '<meta property="og:locale" content="az_AZ" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    (($id eq 'index' || $id eq 'office') ? $ld->($og) : ()),
    '<script src="/content/site.js"></script>',
    '<script src="/assets/st-content.js"></script>', '';
  $h =~ s{</head>}{$head</head>} or die "$file: нет </head>";
  $h =~ s{</body>}{<script src="/assets/imx-cms.js" data-page="$id"></script>\n</body>} or die "$file: нет </body>";
  spit("$PUB/$file", $h);
  $seenpage{$id} = () = $h =~ /data-i18n-html="/g;
}

# фото: скачать отсутствующие
my $got = 0;
for my $n (sort keys %imgsrc) {
  next if -s "$PUB/img/$n";
  system('curl', '-s', '-f', '-m', '60', '-o', "$PUB/img/$n.part", $imgsrc{$n}) == 0 or die "не скачалось: $imgsrc{$n}\n";
  rename "$PUB/img/$n.part", "$PUB/img/$n" or die $!; $got++;
}
opendir my $dh, "$PUB/img" or die; my @stale = grep { !/^\./ && !$imgsrc{$_} } readdir $dh; closedir $dh;
unlink map { "$PUB/img/$_" } @stale;

# редактор SpectrTech
copy("cms/kit/assets/$_", "$PUB/assets/$_") or die "$_: $!" for qw(st-content.js st-editor.js st-editor.css st-empty.svg);
copy('cms/imx-cms.js', "$PUB/assets/imx-cms.js") or die $!;
copy('cms/mainedit.html', "$PUB/mainedit.html") or die $!;
my $js = sub { my $s = shift; $s =~ s/\\/\\\\/g; $s =~ s/'/\\'/g; "'$s'" };
spit("$PUB/assets/st-config.js", join '',
  "/* IM Motors · st-config.js — страницы сайта для редактора SpectrTech (генерирует build-cf.pl).\n",
  "   Тексты (AZ/RU/EN) правятся кликом по тексту или во вкладке «Mətnlər»; фото — кликом по фото;\n",
  "   телефоны и ссылки — во вкладке контактов. Шапку, CTA и подвал правьте на главной — они общие для всех страниц. */\n",
  "window.ST_EDITOR = {\n  site: 'immotors-az',\n  brand: 'IM Motors Azərbaycan',\n  langs: ['az', 'ru', 'en'],\n  pages: [\n",
  join(",\n", map { "    { id: '$_->[0]', file: '$_->[2]', name: { az: " . $js->($_->[3]) . ', ru: ' . $js->($_->[4]) . ', en: ' . $js->($_->[5]) . ' } }' } @PAGES),
  "\n  ]\n};\n");
spit("$PUB/content/site.js", qq(window.ST_CONTENT={"v":1,"site":"immotors-az","rev":0,"demo":false,"updated":"","pages":{},"img":{},"tel":{},"href":{}};\n));

# SEO и служебные файлы
spit("$PUB/favicon.svg", $FAVICON);
spit("$PUB/robots.txt", "User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /mainedit\n\nSitemap: $SITE/sitemap.xml\n");
spit("$PUB/sitemap.xml", join '', qq(<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n),
  (map { "  <url><loc>$SITE$_->[2]</loc><lastmod>$date</lastmod></url>\n" } grep { $_->[0] ne '404' } @PAGES), "</urlset>\n");
spit("$PUB/_redirects", join '', map { "$_->[0] $_->[1] 301\n" }
  ['/ls6erev', '/ls6'], ['/ls9erev', '/ls9'], ['/calc', '/'], ['/calcm', '/'], ['/calcd', '/'], ['/economy', '/'], ['/33', '/'], ['/page-not-found', '/']);
spit("$PUB/_headers", <<'H');
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Strict-Transport-Security: max-age=31536000
  X-Frame-Options: SAMEORIGIN
/img/*
  Cache-Control: public, max-age=31536000, immutable
/assets/*
  Cache-Control: public, max-age=3600
/mainedit*
  X-Robots-Tag: noindex, nofollow
  Cache-Control: no-store
H

# Worker (сервер редактора из комплекта) и настройки Cloudflare
copy('cms/kit/backend/worker.js', "$OUT/worker.js") or die $!;
my $kv = -f "$OUT/kv-id.txt" ? (slurp("$OUT/kv-id.txt") =~ /([0-9a-f]{32})/ ? $1 : die "$OUT/kv-id.txt: нет id\n") : 'local-dev-kv';
spit("$OUT/wrangler.toml", <<T);
# IM Motors · сайт immotors.az на Cloudflare Workers + редактор SpectrTech (worker.js из комплекта, cms/kit/VERSION).
# Генерирует build-cf.pl — правьте там. id хранилища KV — в deploy/kv-id.txt.
name = "spectrtech-immotors-az"
main = "worker.js"
compatibility_date = "2026-01-15"

[assets]
directory = "./public"
binding = "ASSETS"
# /l7 → l7.html; неизвестный адрес → 404.html с кодом 404
html_handling = "auto-trailing-slash"
not_found_handling = "404-page"
# Worker нужен только редактору: API, файл правок и загруженные фото; страницы и фото Cloudflare отдаёт сам
run_worker_first = ["/api/*", "/content/site.js", "/uploads/*"]

[[kv_namespaces]]
binding = "ST_KV"
id = "$kv"
T

my $bytes = 0; $bytes += -s "$PUB/img/$_" for keys %imgsrc;
printf "deploy/public: %d страниц, ключей текстов %d (%s); фото %d (%.1f МБ, скачано %d, удалено лишних %d); kv=%s\n",
  scalar @PAGES, scalar keys %keytext, join(' ', map { "$_->[0]:$seenpage{$_->[0]}" } @PAGES), scalar keys %imgsrc, $bytes / 1048576, $got, scalar @stale, $kv;
