#!/usr/bin/perl
# Собирает внутренние страницы сайта.
#  1) Страницы моделей: из pages/data/models.json → блоки pages/<модель>/m1…m9-*.html (каждый файл = один блок Tilda).
#  2) Все страницы (модели + pages/<страница>/ с готовыми блоками) → <страница>.html в корне для локального просмотра:
#     шапка 01-header, блоки страницы, 09-cta (кроме документов), подвал 10-footer.
# Запуск: perl build-pages.pl  (его вызывает build.sh)
use strict; use warnings; use utf8; use JSON::PP;
binmode STDOUT, ':utf8';
chdir((__FILE__ =~ m{^(.*)[/\\]}) ? $1 : '.');

sub slurp { my $f = shift; open my $h, '<:encoding(UTF-8)', $f or die "$f: $!"; local $/; my $s = <$h>; close $h; $s }
sub spit  { my ($f, $s) = @_; open my $h, '>:encoding(UTF-8)', $f or die "$f: $!"; print $h $s; close $h }

my $D = JSON::PP->new->utf8(0)->relaxed->decode(slurp('pages/data/models.json'));
my %LAB = %{$D->{labels}}; my %TOK = %{$D->{tokens}};
my @LANGS = qw(az ru en);

# фото IM: модель:номер → [ширина, высота, адрес]
my %IMG; for (split /\n/, slurp('pages/data/imx-images.tsv')) { my ($m, $id, $w, $h, $u) = split /\t/; $IMG{"$m:$id"} = [$w, $h, $u] }
my %COL; for (split /\n/, slurp('pages/data/imx-colors.tsv')) { my ($m, $c, $u) = split /\t/; $COL{"$m:$c"} = $u }

sub L { my $v = shift; return '' unless defined $v; return $v unless ref $v eq 'ARRAY';
  join '', map { qq(<span data-l="$LANGS[$_]">$v->[$_]</span>) } 0 .. 2 }
sub V { my $v = shift; return L($TOK{$v} // die "token $v") if !ref $v && $v =~ /^\$/; $v }
sub plain { my $v = shift; $v = $v->[0] if ref $v eq 'ARRAY'; $v =~ s/<[^>]+>//g; $v =~ s/"/&quot;/g; $v }

# адрес фото: обрезаем подписи внизу кадров IM (по умолчанию оставляем верхние 70%), сжимаем в webp
sub img { my ($ref, $w) = @_; $w ||= 1600;
  return $ref if $ref =~ m{^photos/};
  if ($ref =~ /^c:(\w+):(\w+)$/) { my $u = $COL{"$1:$2"} or die "color $ref"; return "$u?x-oss-process=image/resize,w_$w" }
  my ($id, $crop) = split /@/, $ref; my $r = $IMG{$id} or die "no image $ref";
  my ($W, $H, $u) = @$r; my ($x0, $x1, $y0, $y1) = (0, 1, 0, 0.7);
  if (defined $crop) { ($x0, $x1) = ($1, $2) if $crop =~ /x([\d.]+)-([\d.]+)/; ($y0, $y1) = ($1, $2) if $crop =~ /y([\d.]+)-([\d.]+)/ }
  my ($cx, $cy, $cw, $ch) = (int($W * $x0), int($H * $y0), int($W * ($x1 - $x0)), int($H * ($y1 - $y0)));
  "$u?x-oss-process=image/crop,x_$cx,y_$cy,w_$cw,h_$ch/resize,w_$w/quality,q_82/format,webp" }

my $ARR_L = '<svg viewBox="0 0 16 16" fill="none"><path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" stroke-width="1.4"/></svg>';
my $ARR_R = '<svg viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.4"/></svg>';
my %NOTE = (
  1 => ['Funksiyaların işi yerli yol şəraitindən, xəritələrdən və qanunvericilikdən asılıdır.', 'Работа функций зависит от местных дорог, карт и законодательства.', 'Feature availability depends on local roads, maps and regulations.'],
  2 => ['Şarj sürəti stansiyanın gücündən, temperaturdan və batareyanın vəziyyətindən asılıdır.', 'Скорость зарядки зависит от мощности станции, температуры и состояния батареи.', 'Charging speed depends on the charger\'s power, temperature and battery condition.'],
);

sub head { my ($file, $what, $slug) = @_;
  "<!-- ════════════════════════════════════\n  $file — страница /$slug. Tilda: отдельный блок (Vibe/T123), отступы блока = 0.\n  $what\n  Собрано build-pages.pl из pages/data/models.json — правьте данные там и пересоберите.\n════════════════════════════════════ -->\n" }

sub model_blocks { my ($slug) = @_; my $m = $D->{models}{$slug}; my $N = $m->{name}; my $IM = "IM <b>$N</b>";
  my %out; my $tdh = "/testdrive?model=$slug";

  # m1 · шапка модели + подменю
  my $h = $m->{hero}; my $pic = $h->{near}
    ? qq(<picture>\n      <source media="(min-width:1600px) and (min-aspect-ratio:16/9)" srcset="$h->{near}" />\n      <img alt="IM $N" src="$h->{wide}" fetchpriority="high" />\n    </picture>)
    : qq(<img alt="IM $N" src="$h->{img}" fetchpriority="high" />);
  my $badge = $m->{badge} ? qq(<span class="imx-mh__badge">) . L($m->{badge}) . '</span>' : '';
  my $hs = join "\n", map { qq(        <div>$_->[0]<small>) . L($_->[1]) . '</small></div>' } @{$m->{hs}};
  my @nav = (['imxOverview', ['Ümumi', 'Обзор', 'Overview']], ['imxDesign', ['Dizayn', 'Дизайн', 'Design']], ['imxColors', ['Rənglər', 'Цвета', 'Colours']],
             ['imxInterior', ['Salon', 'Салон', 'Interior']], ['imxTechM', ['Texnologiya', 'Технологии', 'Technology']], ['imxSpecs', ['Xüsusiyyətlər', 'Характеристики', 'Specifications']], ['imxStock', ['Salonda', 'В наличии', 'In stock']]);
  my $nav = join "\n", map { qq(      <a href="#$_->[0]">) . L($_->[1]) . '</a>' } @nav;
  $out{'m1-hero'} = head('m1-hero.html', "Шапка модели на весь экран + подменю, которое прилипает к верху при прокрутке.", $slug) . <<HTML;
<section class="imx imx-mh" id="imxTop">
  <figure class="imx-mh__bg" style="--dpos:$h->{dpos};--pos:$h->{pos}">
    $pic
  </figure>
  <div class="imx-mh__in">
    <div class="imx-wrap">
      <span class="imx-eyebrow">@{[L($m->{type})]}</span>
      <h1 class="imx-mh__name">$IM$badge</h1>
      <p class="imx-mh__tag">@{[L($m->{tag})]}</p>
      <div class="imx-mh__row">
        <div class="imx-mh__specs">
$hs
        </div>
        <div class="imx-mh__ctas">
          <a class="imx-btn imx-btn--solid" href="$tdh">@{[L(['Test sürüşünə yazıl', 'Записаться на тест-драйв', 'Book a test drive'])]}$ARR_R</a>
          <a class="imx-btn imx-btn--ghost" href="#imxStock">@{[L(['Salonda olanlar', 'В наличии', 'In stock'])]}</a>
        </div>
      </div>
    </div>
  </div>
  <nav class="imx-msub" aria-label="IM $N">
    <div class="imx-wrap imx-msub__in">
      <a class="imx-msub__name" href="#imxTop">$IM</a>
      <div class="imx-msub__nav">
$nav
      </div>
      <a class="imx-btn imx-btn--accent imx-btn--sm imx-msub__cta" href="$tdh">@{[L(['Test sürüşü', 'Тест-драйв', 'Test drive'])]}</a>
    </div>
  </nav>
</section>
HTML

  # m2 · обзор
  my $o = $m->{ov}; my $i = 0;
  my $figs = join "\n", map { $i++; qq(      <div class="imx-r" data-d="$i"><b>$_->[0]<small>$_->[1]</small></b><span>) . L($_->[2]) . '</span></div>' } @{$o->{f}};
  $out{'m2-overview'} = head('m2-overview.html', 'Обзор: главная мысль и четыре ключевые цифры.', $slug) . <<HTML;
<section class="imx imx-sec imx-mo" id="imxOverview">
  <div class="imx-wrap">
    <div class="imx-mo__grid">
      <div class="imx-r">
        <span class="imx-eyebrow">IM $N</span>
        <h2 class="imx-sec__t">@{[L($o->{t})]}</h2>
      </div>
      <p class="imx-lead imx-r" data-d="1">@{[L($o->{d})]}</p>
    </div>
    <div class="imx-mo__figs">
$figs
    </div>
  </div>
</section>
HTML

  # m3 · дизайн: лента
  my $items = join "\n", map { my ($ref, $t, $d) = @$_; my $src = img($ref, 1800);
    qq(    <figure class="imx-md__item">\n      <div class="imx-md__ph"><img loading="lazy" alt="IM $N — @{[plain($t)]}" src="$src" /></div>\n      <figcaption class="imx-md__cap"><b>) . L($t) . '</b><span>' . L($d) . "</span></figcaption>\n    </figure>" } @{$m->{design}{items}};
  $out{'m3-design'} = head('m3-design.html', 'Дизайн: лента больших фото с подписями, листается стрелками и пальцем.', $slug) . <<HTML;
<section class="imx imx-sec imx-md" id="imxDesign">
  <div class="imx-wrap">
    <div class="imx-sec__head">
      <div class="imx-r">
        <span class="imx-eyebrow">@{[L(['Dizayn', 'Дизайн', 'Design'])]}</span>
        <h2 class="imx-sec__t">@{[L($m->{design}{t})]}</h2>
      </div>
      <div class="imx-arrows imx-r" data-d="1">
        <button type="button" data-imx-prev aria-label="Previous">$ARR_L</button>
        <button type="button" data-imx-next aria-label="Next">$ARR_R</button>
      </div>
    </div>
  </div>
  <div class="imx-md__track" data-imx-track>
$items
  </div>
</section>
HTML

  # m4 · цвета
  my @c = @{$m->{colors}}; my $n = @c; my $k = 0;
  my $cars = join "\n", map { my $on = $k++ ? '' : ' is-on'; my $ld = $on ? '' : ' loading="lazy"';
    qq(    <figure class="imx-mc__car$on"><img$ld alt="IM $N — @{[plain($_->[2])]}" src="@{[img("c:$slug:$_->[0]", 1600)]}" /></figure>) } @c;
  $k = 0; my $names = join '', map { my $on = $k++ ? '' : ' class="is-on"'; "<span$on>" . L($_->[2]) . '</span>' } @c;
  $k = 0; my $sw = join "\n", map { my $on = $k++ ? '' : ' class="is-on"'; my $en = $_->[2][2];
    qq(        <button type="button"$on style="--c:$_->[1]" aria-label="$en"></button>) } @c;
  my $ruN = $n < 5 ? 'цвета' : 'цветов';
  $out{'m4-colors'} = head('m4-colors.html', 'Цвета кузова: машина в «студии», образцы переключают фото и название.', $slug) . <<HTML;
<section class="imx imx-sec imx-mc" id="imxColors">
  <div class="imx-wrap">
    <div class="imx-sec__head">
      <div class="imx-r">
        <span class="imx-eyebrow">@{[L(['Rənglər', 'Цвета', 'Colours'])]}</span>
        <h2 class="imx-sec__t">@{[L(['Öz rənginizi <b>seçin.</b>', 'Выберите <b>свой цвет.</b>', 'Choose <b>your colour.</b>'])]}</h2>
      </div>
      <p class="imx-lead imx-r" data-d="1">@{[L(["IM $N üçün $n kuzov rəngi.", "$n $ruN кузова для IM $N.", "$n body colours for the IM $N."])]}</p>
    </div>
    <div class="imx-mc__stage imx-r">
$cars
    </div>
    <div class="imx-mc__bar">
      <div class="imx-mc__name">$names</div>
      <div class="imx-mc__sw">
$sw
      </div>
    </div>
    <p class="imx-mc__note">@{[L(['Rənglərin mövcudluğunu ONVOLT-da dəqiqləşdirin.', 'Наличие цветов уточняйте в ONVOLT.', 'Please check colour availability with ONVOLT.'])]}</p>
  </div>
</section>
HTML

  # m5 · салон
  my $in = $m->{interior}; $i = 0;
  my $feat = join "\n", map { $i++; qq(      <div class="imx-r" data-d="$i"><b>) . L($_->[0]) . '</b><p>' . L($_->[1]) . '</p></div>' } @{$in->{f}};
  $i = 0; my $gal = join "\n", map { $i++; qq(      <figure class="imx-r" data-d="$i"><img loading="lazy" alt="IM $N" src="@{[img($_, $i == 1 ? 1600 : 1000)]}" /></figure>) } @{$in->{gal}};
  $out{'m5-interior'} = head('m5-interior.html', 'Салон: большое фото с заголовком, четыре особенности и три фото.', $slug) . <<HTML;
<section class="imx imx-sec imx-mi" id="imxInterior">
  <div class="imx-wrap">
    <div class="imx-mi__hero imx-r">
      <img loading="lazy" alt="IM $N — salon" src="@{[img($in->{img}, 2000)]}" />
      <div class="imx-mi__over">
        <div>
          <span class="imx-eyebrow">@{[L(['Salon', 'Салон', 'Interior'])]}</span>
          <h2 class="imx-sec__t">@{[L($in->{t})]}</h2>
        </div>
        <p class="imx-lead">@{[L($in->{d})]}</p>
      </div>
    </div>
    <div class="imx-mi__feat">
$feat
    </div>
    <div class="imx-mi__gal">
$gal
    </div>
  </div>
</section>
HTML

  # m6 · технологии: вкладки
  $i = 0; my $tabs = join "\n", map { my $on = $i ? '' : ' class="is-on" aria-selected="true"'; my $s = qq(        <button type="button" role="tab"$on data-tab="$i">) . L($_->{tab}) . '</button>'; $i++; $s } @{$m->{tech}};
  $i = 0; my $panes = join "\n", map { my $t = $_; my $on = $i ? '' : ' is-on';
    my $li = join '', map { '<li>' . L($_) . '</li>' } @{$t->{li}};
    my $nt = $t->{note} ? qq(\n          <p class="imx-mt__note">) . L($NOTE{$t->{note}}) . '</p>' : '';
    my $s = qq(    <div class="imx-mt__pane$on" data-pane="$i" role="tabpanel">\n      <div class="imx-mt__ph"><img loading="lazy" alt="IM $N — @{[plain($t->{tab})]}" src="@{[img($t->{img}, 1600)]}" /></div>\n      <div>\n          <span class="imx-mt__tag">) . L($t->{tag}) . qq(</span>\n          <h3 class="imx-mt__t">) . L($t->{t}) . qq(</h3>\n          <p class="imx-mt__d">) . L($t->{d}) . qq(</p>\n          <ul class="imx-mt__list">$li</ul>$nt\n      </div>\n    </div>); $i++; $s } @{$m->{tech}};
  $out{'m6-tech'} = head('m6-tech.html', 'Технологии: вкладки (шасси, энергия, помощь водителю, салон) с фото и фактами.', $slug) . <<HTML;
<section class="imx imx-sec imx-mt" id="imxTechM">
  <div class="imx-wrap">
    <div class="imx-sec__head">
      <div class="imx-r">
        <span class="imx-eyebrow">@{[L(['Texnologiya', 'Технологии', 'Technology'])]}</span>
        <h2 class="imx-sec__t">@{[L(['Texnologiya <b>hər detalda.</b>', 'Технологии <b>в каждой детали.</b>', 'Technology <b>in every detail.</b>'])]}</h2>
      </div>
      <div class="imx-tabs imx-r" data-d="1" data-imx-tabs role="tablist">
$tabs
      </div>
    </div>
$panes
  </div>
</section>
HTML

  # m7 · характеристики
  my $sp = $m->{specs}; my @tr = @{$sp->{trims}}; my $nt = @tr; my $grp = -1; my $hidden = 0; my @rows;
  for my $r (@{$sp->{rows}}) {
    if ($r->[0] =~ /^#/) { $grp++; my $x = $grp >= 2 ? ' data-x' : ''; $hidden ||= $x ne '';
      push @rows, qq(          <tr class="imx-ms__grp"$x><th colspan="@{[$nt + 1]}">) . L($LAB{$r->[0]} // die "label $r->[0]") . '</th></tr>'; next }
    my ($key, $val) = @$r; my $x = $grp >= 2 ? ' data-x' : '';
    my $cells = ref $val eq 'ARRAY' ? join('', map { '<td>' . V($_) . '</td>' } @$val) : qq(<td colspan="$nt">) . V($val) . '</td>';
    push @rows, qq(          <tr$x><th>) . L($LAB{$key} // die "label $key") . "</th>$cells</tr>" }
  my $thead = join '', map { "<th>$_</th>" } @tr;
  my $mnote = $sp->{note} ? ' ' . L($sp->{note}) : '';
  my $more = $hidden ? qq(\n    <div class="imx-ms__more"><button type="button" class="imx-btn imx-btn--ghost" data-imx-more><span class="is-closed">) . L(['Bütün göstəricilər', 'Все характеристики', 'All specifications']) . '</span><span class="is-open">' . L(['Qısa siyahı', 'Свернуть', 'Show less']) . '</span></button></div>' : '';
  my $short = $hidden ? ' is-short' : '';
  $out{'m7-specs'} = head('m7-specs.html', 'Характеристики по версиям (данные immotors.com). Сначала главное, остальное — по кнопке.', $slug) . <<HTML;
<section class="imx imx-sec imx-ms$short" id="imxSpecs">
  <div class="imx-wrap">
    <div class="imx-sec__head">
      <div class="imx-r">
        <span class="imx-eyebrow">@{[L(['Xüsusiyyətlər', 'Характеристики', 'Specifications'])]}</span>
        <h2 class="imx-sec__t">@{[L(['Texniki <b>göstəricilər.</b>', 'Технические <b>характеристики.</b>', 'Technical <b>specifications.</b>'])]}</h2>
      </div>
    </div>
    <div class="imx-ms__scroll imx-r">
      <table>
        <thead><tr><th>IM $N</th>$thead</tr></thead>
        <tbody>
@{[join "\n", @rows]}
        </tbody>
      </table>
    </div>$more
    <p class="imx-ms__note">@{[L(['Göstəricilər istehsalçının məlumatlarıdır (Çin bazarı, CLTC sınaq dövrü) və real istifadədə fərqlənə bilər. Azərbaycanda təklif olunan versiyaları və avadanlığı ONVOLT-da dəqiqləşdirin.', 'Данные производителя (рынок Китая, цикл CLTC); в реальной эксплуатации показатели могут отличаться. Версии и комплектации для Азербайджана уточняйте в ONVOLT.', 'Manufacturer data (China market, CLTC cycle); real-world figures may differ. Please check the versions and equipment offered in Azerbaijan with ONVOLT.'])]}$mnote</p>
  </div>
</section>
HTML

  # m8 · в наличии — тот же блок, что на главной, но только эта модель
  my $st = slurp('blocks/08-stock.html');
  $st =~ s/^<!--.*?-->\n/head('m8-stock.html', "Машины в наличии на turbo.az — только IM $N (data-model). Код тот же, что у 08-stock на главной.", $slug)/se;
  $st =~ s/(<section class="imx imx-stock" id="imxStock")/$1 data-model="$N"/ or die 'stock section';
  $st =~ s{<h2 class="imx-h2">.*?</h2>}{'<h2 class="imx-h2">' . L(["Salonda olan<br><b>IM $N.</b>", "IM $N<br><b>в салоне.</b>", "IM $N<br><b>in our showroom.</b>"]) . '</h2>'}se or die 'stock h2';
  $out{'m8-stock'} = $st;

  # m9 · другие модели
  # у картинок разные поля: машина 63–77 % ширины, центр 45–52 % — масштаб и сдвиг выравнивают её до 80 % ширины,
  # по центру и с колёсами на одной линии (рамки машин измерены по прозрачности PNG 700×525)
  my %fit = (
    l7  => '--s:1.039;--tx:-2.0%;--ty:2.0%',  ls7 => '--s:1.047;--tx:-2.2%;--ty:-5.6%', l6 => '--s:1.261;--tx:0.5%;--ty:-4.2%',
    ls6 => '--s:1.092;--tx:5.8%;--ty:-3.0%', ls9 => '--s:1.129;--tx:4.0%;--ty:-3.0%',  ls8 => '--s:1.145;--tx:4.7%;--ty:-1.3%',
  );
  my $cards = join "\n", map { my $o = $D->{models}{$_};
    qq(      <a class="imx-mm__card imx-r" href="/$_"><div class="imx-mm__ph"><img loading="lazy" alt="IM $o->{name}" style="$fit{$_}" src="@{[img($o->{card}, 700)]}" /></div><b>IM <strong>$o->{name}</strong></b><span>) . L($o->{type}) . '</span></a>' }
    grep { $_ ne $slug } @{$D->{order}};
  $out{'m9-more'} = head('m9-more.html', 'Другие модели IM — карточки со ссылками на их страницы.', $slug) . <<HTML;
<section class="imx imx-sec imx-mm" id="imxMore">
  <div class="imx-wrap">
    <div class="imx-sec__head">
      <div class="imx-r">
        <span class="imx-eyebrow">@{[L(['Modellər', 'Модели', 'Models'])]}</span>
        <h2 class="imx-sec__t">@{[L(['Digər <b>IM modelləri.</b>', 'Другие <b>модели IM.</b>', 'Other <b>IM models.</b>'])]}</h2>
      </div>
      <a class="imx-btn imx-btn--ghost imx-r" data-d="1" href="/#imxModels">@{[L(['Bütün modellər', 'Все модели', 'All models'])]}</a>
    </div>
    <div class="imx-mm__grid">
$cards
    </div>
  </div>
</section>
HTML
  return \%out }

# ── 1) блоки страниц моделей
my %META;
for my $slug (@{$D->{order}}) {
  my $blocks = model_blocks($slug); mkdir "pages/$slug" unless -d "pages/$slug";
  unlink glob("pages/$slug/m*.html");
  spit("pages/$slug/$_.html", $blocks->{$_}) for keys %$blocks;
  my $m = $D->{models}{$slug}; $META{$slug} = { title => $m->{seo}[0], descr => $m->{seo}[1], cta => 1 };
}

# ── 2) прочие страницы: pages/<страница>/_meta.txt (1-я строка — title, 2-я — description, 3-я — «nocta» без блока 09-cta)
for my $dir (glob 'pages/*') { next unless -d $dir && -f "$dir/_meta.txt"; my ($slug) = $dir =~ m{pages/(.+)};
  my @l = split /\n/, slurp("$dir/_meta.txt"); $META{$slug} = { title => $l[0], descr => $l[1] // '', cta => (($l[2] // '') =~ /nocta/ ? 0 : 1) } }

# ── 3) локальные страницы <страница>.html
my $globals = slurp('blocks/00-globals.html') . slurp('blocks/00-pages.html');
my $sample = -f 'turbo-proxy/sample.json' ? '<script>window.IMX_STOCK_SAMPLE=' . slurp('turbo-proxy/sample.json') . ';</script>' : '';
my ($hdr, $cta, $ftr) = map { slurp($_) } qw(blocks/01-header.html blocks/09-cta.html blocks/10-footer.html);
for my $slug (sort keys %META) {
  my $mt = $META{$slug}; my $body = join "\n", map { slurp($_) } sort grep { !m{/_} } glob("pages/$slug/*.html");
  my $page = qq(<!DOCTYPE html><html lang="az"><head><meta charset="utf-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1" />\n<title>$mt->{title}</title>\n<meta name="description" content="$mt->{descr}" />\n<style>body{margin:0}</style>\n$globals\n$sample\n</head><body>\n$hdr\n$body\n) . ($mt->{cta} ? "$cta\n" : '') . "$ftr\n</body></html>\n";
  spit("$slug.html", $page);
  printf "built %-10s %6d bytes\n", "$slug.html", length $page;
}

# ── perl build-pages.pl --images → список всех фото IM на страницах (для проверки обрезки)
if (grep { $_ eq '--images' } @ARGV) { open my $o, '>:encoding(UTF-8)', 'pages/data/_used-images.tsv' or die;
  for my $slug (@{$D->{order}}) { my $m = $D->{models}{$slug};
    my @refs = ((map { $_->[0] } @{$m->{design}{items}}), $m->{interior}{img}, @{$m->{interior}{gal}}, (map { $_->{img} } @{$m->{tech}}));
    print $o "$_\t" . img($_, 480) . "\n" for @refs }
  close $o; print "pages/data/_used-images.tsv\n" }
