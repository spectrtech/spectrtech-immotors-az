#!/usr/bin/env bash
# Собирает все блоки в один файл для предпросмотра: immotors-v2/index.html
# В Tilda вставляются отдельные файлы из blocks/ (00-globals — в <head> сайта, остальные — в T123).
set -e
cd "$(dirname "$0")"
{
  echo '<!DOCTYPE html><html lang="az"><head><meta charset="utf-8" />'
  echo '<meta name="viewport" content="width=device-width, initial-scale=1" />'
  echo '<title>IM Motors Azərbaycan — rəsmi idxalçı ONVOLT</title>'
  echo '<meta name="description" content="IM Motors elektromobilləri Azərbaycanda: LS9, LS8, LS6 EREV, L7, LS7, L6. Salonda olan avtomobillər, pulsuz test sürüşü, rəsmi servis. Bakı, Ceyhun Hacıbəyli 194." />'
  echo '<style>body{margin:0}</style>'
  cat blocks/00-globals.html blocks/00-pages.html
  # пример данных turbo.az для превью блока 08-stock (на сайте данные идут от посредника)
  echo '<script>window.IMX_STOCK_SAMPLE='; cat turbo-proxy/sample.json; echo ';</script>'
  echo '</head><body>'
  for f in blocks/0[1-9]-*.html blocks/1[0-9]-*.html; do cat "$f"; echo; done
  echo '</body></html>'
} > index.html
echo "built index.html ($(wc -c < index.html) bytes)"
perl build-pages.pl
