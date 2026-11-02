#!/usr/bin/perl
# Готовит превью для публикации по ссылке (Claude Artifact): preview/site.html (главная) + preview/<страница>.html.
# Страницы-артефакты не грузят картинки с чужих сайтов — фото скачиваются в preview/assets/.
# Ссылки вида /ls9 и /#imxStock переписываются на файлы превью (ls9.html, home.html#imxStock).
# Запускается из build-preview.sh после build.sh.
use strict; use warnings; use Digest::MD5 qw(md5_hex);
chdir((__FILE__ =~ m{^(.*)[/\\]}) ? $1 : '.');

sub slurp { my $f = shift; open my $h, '<:raw', $f or die "$f: $!"; local $/; my $s = <$h>; close $h; $s }
sub spit  { my ($f, $s) = @_; open my $h, '>:raw', $f or die "$f: $!"; print $h $s; close $h }

my @pages = grep { $_ ne 'index' && $_ ne 'site' } map { /^(.+)\.html$/ ? $1 : () } sort glob '*.html';
my %src = (index => slurp('index.html')); $src{$_} = slurp("$_.html") for @pages;

# 1) скачать все внешние фото
my %map; my $hosts = qr{https://(?:portal-static\.immotors\.com|im-cdn\.immotors\.com|turbo\.azstatic\.com|static\.tildacdn\.com|i\.ytimg\.com)/[^"' )\\<>]+};
for my $html (values %src) { while ($html =~ /($hosts)/g) { $map{$1} //= 1 } }
mkdir 'preview/assets' unless -d 'preview/assets';
my ($got, $miss) = (0, 0);
for my $u (sort keys %map) {
  my $ext = $u =~ /format,webp/ ? 'webp' : $u =~ /\.png(\?|$)/ ? 'png' : 'jpg';
  my $file = 'assets/' . substr(md5_hex($u), 0, 12) . ".$ext"; $map{$u} = $file;
  next if -s "preview/$file";
  system('curl', '-s', '-f', '-m', '60', '-o', "preview/$file", $u) == 0 ? $got++ : $miss++;
}

# 2) переписать фото и ссылки; превью-метка; секции видны сразу
my @urls = sort { length($b) <=> length($a) } keys %map;
my $slugs = join '|', map { quotemeta } @pages;
sub fix { my ($h) = @_;
  for my $u (@urls) { my $f = $map{$u}; $h =~ s/\Q$u\E/$f/g }
  $h =~ s/data-endpoint="https:[^"]*"/data-endpoint=""/g;
  $h =~ s{href="/"}{href="home.html"}g;
  $h =~ s{href="/#}{href="home.html#}g;
  $h =~ s{href="/($slugs)((?:\?[^"#]*)?(?:#[^"]*)?)"}{href="$1.html$2"}g;
  $h =~ s{<head>}{<head><script>document.documentElement.setAttribute('data-imx-preview','')</script>};
  $h =~ s{</body>}{<style>.imx-r{opacity:1 !important;transform:none !important;} :root{color-scheme:dark;}</style></body>};
  $h }

my $home = fix($src{index});
spit('preview/home.html', $home);
# главная страница артефакта: без оболочки документа (её добавляет сам артефакт)
(my $site = $home) =~ s/<!DOCTYPE html><html[^>]*><head>//; $site =~ s/<\/head><body>//; $site =~ s/<\/body><\/html>\s*$//;
$site =~ s/<title>[^<]*<\/title>/<title>IM Motors Azerbaijan<\/title>/;
$site = "<script>document.documentElement.setAttribute('data-imx-preview','')</script>\n" . $site;
spit('preview/site.html', $site);
spit("preview/$_.html", fix($src{$_})) for @pages;

my @leftover = grep { $site =~ /\Q$_\E/ } ('portal-static.immotors.com', 'im-cdn.immotors.com');
printf "preview: site.html + home.html + %d pages, %d images (%d new, %d failed)%s\n", scalar @pages, scalar(keys %map), $got, $miss, @leftover ? " — WARNING leftover @leftover" : '';
print join(' ', map { "$_.html" } @pages), "\n";
