#!/usr/bin/env bash
# Приводит логотипы команд к единому виду: обрезает прозрачные поля у каждого файла
# и вписывает его в общий квадрат с одинаковым отступом — тогда логотипы перестают
# выглядеть «вразнобой» независимо от того, как были обрезаны исходники.
#
# Когда запускать: после того как положил свои .webp/.png в apps/web/public/teams/
#   bash infra/normalize-logos.sh
#   docker compose up --build -d      # пересобрать web, чтобы подхватить файлы
#
# Требуется ImageMagick (magick или convert). Оригиналы бэкапятся в teams/_orig/.
set -euo pipefail

DIR="$(cd "$(dirname "$0")/../apps/web/public/teams" && pwd)"
SIZE=128                 # сторона итогового квадрата, px
MARGIN=10                # отступ с каждой стороны, %
INNER=$(( SIZE - SIZE * MARGIN / 100 * 2 ))

if command -v magick >/dev/null 2>&1; then IM="magick"
elif command -v convert >/dev/null 2>&1; then IM="convert"
else echo "Нужен ImageMagick: apt-get install -y imagemagick"; exit 1; fi

cd "$DIR"
mkdir -p _orig
shopt -s nullglob
files=( *.webp *.png )
if [ ${#files[@]} -eq 0 ]; then echo "нет .webp/.png в $DIR"; exit 0; fi

for f in "${files[@]}"; do
  cp -n "$f" "_orig/$f"                       # бэкап оригинала (не перезатирает)
  "$IM" "_orig/$f" -trim +repage \
    -resize "${INNER}x${INNER}" \
    -background none -gravity center -extent "${SIZE}x${SIZE}" \
    "$f"
  echo "✓ $f"
done
echo "Готово. Оригиналы — в $DIR/_orig/. Теперь: docker compose up --build -d"
