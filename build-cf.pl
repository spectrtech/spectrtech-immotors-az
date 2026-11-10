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

# ── цифры для редактора: data-st="SPECS_<хеш>.<n>" data-sk="<id>" + подписи для списка «Rəqəmlər» (st-config.js) ──
# Одно значение на все языки. id не зависит от порядка: раздел + модель + ключ подписи (+ колонка таблицы).
my %speclab;   # страница → [[az, ru, en], …] в порядке data-st
sub plain { my $t = shift; $t =~ s/<[^>]*>//g; $t =~ s/&amp;/&/g; $t =~ s/\s+/ /g; $t =~ s/^ | $//g; $t }
sub lab3 { my $k = shift; my $t = $keytext{$k} // die "нет текста для ключа $k\n"; [map { plain($_) } split /\x1f/, $t, -1] }
sub specs {
  my ($s, $page) = @_;
  my (%seen, %lab, %cnt, @rep);
  my $mk = sub { my ($id, $lb, $kind) = @_; my $n = ++$seen{$id}; $id .= ".$n" if $n > 1; $lab{$id} = $lb; $cnt{$kind}++; qq( data-st="SPECS.#" data-sk="$id") };
  my $put = sub { for my $r (sort { $b->[0] <=> $a->[0] } @rep) { substr($s, $r->[0], $r->[1] - $r->[0]) = $r->[2] } @rep = () };
  # 1) шапка модели, слайды и панели главной: <div>ЗНАЧЕНИЕ<small data-i18n-html="k">подпись</small></div>
  my @names; while ($s =~ /__name">IM <b>([^<]+)<\/b>/g) { push @names, [$-[0], $1] }
  while ($s =~ /<div class="imx-(mh|hero|stage)__specs">(.*?)\n[ \t]*<\/div>/sg) {
    my ($sec, $in, $a, $b) = ($1, $2, $-[2], $+[2]);
    my @before = grep { $_->[0] < $a } @names;
    my $model = $sec eq 'mh' ? $page : @before ? $before[-1][1] : die "$page: нет названия модели перед imx-${sec}__specs\n";
    (my $new = $in) =~ s{<div>(?=[^<]+<small data-i18n-html="(t[0-9a-f]{8})")}{
      my $l = lab3($1);
      '<div' . $mk->("$sec." . lc($model) . ".$1", $sec eq 'mh' ? $l : [map { "$model · $_" } @$l], $sec) . '>' }ge;
    push @rep, [$a, $b, $new];
  }
  $put->();
  # 2) строка цифр обзора: <b>ЧИСЛО<small>ЕДИНИЦА</small></b><span data-i18n-html="k">подпись</span>
  $s =~ s{(<div class="imx-r" data-d="\d+">)<b>(?=[^<]*(?:<small>[^<]*</small>)?</b><span data-i18n-html="(t[0-9a-f]{8})">)}{
    $1 . '<b' . $mk->("f.$2", lab3($2), 'f') . '>' }ge;
  # 3) таблица характеристик: ячейки с простым текстом в строках с подписью <th data-i18n-html="k">
  while ($s =~ /<table>(.*?)<\/table>/sg) {
    my ($tb, $a, $b) = ($1, $-[1], $+[1]);
    my @trim; if ($tb =~ /<tr>((?:<th>[^<]*<\/th>)+)<\/tr>/) { @trim = $1 =~ /<th>([^<]*)<\/th>/g; shift @trim }
    (my $new = $tb) =~ s{(<tr\b[^>]*><th data-i18n-html="(t[0-9a-f]{8})">.*?</th>)(.*?)(</tr>)}{
      my ($head, $k, $cells, $end) = ($1, $2, $3, $4); my $l = lab3($k); my $col = 0;
      $cells =~ s{<td\b([^>]*)>(?=([^<]*</td>)?)}{
        my ($at, $plaintext) = ($1, defined $2); my ($span) = $at =~ /colspan="(\d+)"/; $span ||= 1; my $c = $col; $col += $span;
        ($plaintext && $at !~ /data-i18n-html/)
          ? '<td' . $at . $mk->("t.$k.$c", (@trim > 1 && $span < @trim) ? [map { "$_ · $trim[$c]" } @$l] : $l, 't') . '>'
          : "<td$at>" }ge;
      $head . $cells . $end }gse;
    push @rep, [$a, $b, $new];
  }
  $put->();
  # номера по порядку на странице — так их читает imx-cms.js и открывает редактор.
  # Имя списка = SPECS_<хеш состава>: если состав цифр меняется, старые правки не съезжают по номерам —
  # imx-cms.js переносит их в новый список по id.
  my @ids = $s =~ /data-st="SPECS\.#" data-sk="([^"]+)"/g;
  if (@ids) {
    my $ds = 'SPECS_' . substr(md5_hex(join "\n", @ids), 0, 6); my $n = 0;
    $s =~ s{data-st="SPECS\.#" data-sk="([^"]+)"}{ qq(data-st="$ds.) . $n++ . qq(" data-sk="$1") }ge;
    $speclab{$page} = [$ds, [map { $lab{$_} } @ids]];
  }
  my $model = grep { $_ eq $page } qw(l7 ls7 l6 ls6 ls9 ls8);
  die "$page: цифры не размечены (шапка $cnt{mh}, обзор $cnt{f}, таблица $cnt{t})\n" if $model && !($cnt{mh} && $cnt{f} && $cnt{t});
  die "index: цифры не размечены (слайды $cnt{hero}, панели $cnt{stage})\n" if $page eq 'index' && !($cnt{hero} && $cnt{stage});
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
# версии скриптов в адресах (?v=…): /assets/* кешируются на час — после выкладки браузер берёт новый файл сразу
my $ver = sub { substr(md5_hex(slurp(shift)), 0, 8) };
my ($VCMS, $VCON) = ($ver->('cms/imx-cms.js'), $ver->('cms/kit/assets/st-content.js'));
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
  # цифры — отдельный список редактора (одно значение на все языки)
  $h = specs($h, $id);
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
    qq(<script src="/assets/st-content.js?v=$VCON"></script>), '';
  $h =~ s{</head>}{$head</head>} or die "$file: нет </head>";
  $h =~ s{</body>}{<script src="/assets/imx-cms.js?v=$VCMS" data-page="$id"></script>\n</body>} or die "$file: нет </body>";
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
my $js = sub { my $s = shift; $s =~ s/\\/\\\\/g; $s =~ s/'/\\'/g; "'$s'" };
my $lb3 = sub { '[' . join(', ', map { $js->($_) } @{$_[0]}) . ']' };
spit("$PUB/assets/st-config.js", join '',
  "/* IM Motors · st-config.js — страницы сайта для редактора SpectrTech (генерирует build-cf.pl).\n",
  "   Тексты (AZ/RU/EN) правятся кликом по тексту или во вкладке «Mətnlər»; фото — кликом по фото;\n",
  "   телефоны и ссылки — во вкладке контактов. Шапку, CTA и подвал правьте на главной — они общие для всех страниц.\n",
  "   Цифры (шапка модели, цифры обзора, таблица характеристик, цифры на главной) — кликом по цифре или в списке «Rəqəmlər»:\n",
  "   одно значение на все языки. Номер в списке = data-st=\"SPECS_<хеш>.<n>\" на странице, подписи — тексты рядом с цифрой. */\n",
  "(function () {\n",
  "  function SPECS(lb) {\n",
  "    return { title: { az: 'Rəqəmlər', ru: 'Цифры', en: 'Figures' }, fixed: true,\n",
  "      hint: { az: 'Bu səhifənin rəqəmləri. Dəyər bütün dillər üçün birdir. Rəqəmi və vahidi boşluqla yazın, məsələn: 787 hp.',\n",
  "        ru: 'Цифры этой страницы. Значение одно для всех языков. Число и единицу пишите через пробел, например: 787 hp.',\n",
  "        en: 'Figures on this page. One value for all languages. Write the number and unit with a space, e.g. 787 hp.' },\n",
  "      item: { title: function (it, ctx, i) { var l = lb[i] || []; return (l[ctx.li] || l[0] || '') + ': ' + (it && it.v != null ? it.v : ''); },\n",
  "        fields: [{ k: 'v', label: { az: 'Dəyər', ru: 'Значение', en: 'Value' }, type: 'text' }] } };\n",
  "  }\n",
  "  window.ST_EDITOR = {\n    site: 'immotors-az',\n    brand: 'IM Motors Azərbaycan',\n    langs: ['az', 'ru', 'en'],\n    pages: [\n",
  join(",\n", map { my $p = $_; "      { id: '$p->[0]', file: '$p->[2]', name: { az: " . $js->($p->[3]) . ', ru: ' . $js->($p->[4]) . ', en: ' . $js->($p->[5]) . ' }'
    . ($speclab{$p->[0]} ? ",\n        data: { $speclab{$p->[0]}[0]: SPECS([" . join(', ', map { $lb3->($_) } @{ $speclab{$p->[0]}[1] }) . ']) }' : '') . ' }' } @PAGES),
  "\n    ]\n  };\n})();\n");
# mainedit.html — адреса скриптов и стилей редактора с версией
(my $me = slurp('cms/mainedit.html')) =~ s{"/assets/([\w.-]+\.(?:js|css))"}{ -e "$PUB/assets/$1" ? qq("/assets/$1?v=) . $ver->("$PUB/assets/$1") . '"' : die "mainedit.html: нет $1\n" }ge;
spit("$PUB/mainedit.html", $me);
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
# одинаковые настройки в deploy/ (если в Workers Builds указан Path = deploy) и в корне репозитория (если Path не указан)
my $wrangler = sub { my $p = shift; <<T };
# IM Motors · сайт immotors.az на Cloudflare Workers + редактор SpectrTech (worker.js из комплекта, cms/kit/VERSION).
# Генерирует build-cf.pl — правьте там. id хранилища KV — в deploy/kv-id.txt.
name = "spectrtech-immotors-az"
main = "${p}worker.js"
compatibility_date = "2026-01-15"

[assets]
directory = "./${p}public"
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
spit("$OUT/wrangler.toml", $wrangler->(''));
spit('wrangler.toml', $wrangler->("$OUT/"));

my $bytes = 0; $bytes += -s "$PUB/img/$_" for keys %imgsrc;
printf "deploy/public: %d страниц, ключей текстов %d (%s); фото %d (%.1f МБ, скачано %d, удалено лишних %d); kv=%s\n",
  scalar @PAGES, scalar keys %keytext, join(' ', map { "$_->[0]:$seenpage{$_->[0]}" } @PAGES), scalar keys %imgsrc, $bytes / 1048576, $got, scalar @stale, $kv;
