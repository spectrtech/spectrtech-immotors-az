#!/usr/bin/env bash
# Собирает превью для публикации по ссылке (Claude Artifact): preview/site.html (главная), home.html и все внутренние страницы.
# Фото с чужих сайтов скачиваются в preview/assets, свои фото копируются в preview/photos (см. preview.pl).
# Блок «машины в салоне» в превью показывает сохранённый пример (turbo-proxy/sample.json).
set -e
cd "$(dirname "$0")"
bash build.sh >/dev/null
mkdir -p preview/assets preview/photos
rm -f preview/photos/*; cp photos/*-hero-near.jpg photos/*-hero-wide.jpg photos/model-* preview/photos/ 2>/dev/null || true
perl preview.pl
