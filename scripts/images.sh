#!/bin/bash
# Görsel boru hattı: bir kaynak görselden 480/960/1440 px AVIF + WebP + JPG üretir.
# Kullanım: scripts/images.sh kaynak.png adi        → assets/img/adi-480.avif … adi-1440.jpg
# Gerekenler: magick (ImageMagick), cwebp, avifenc (brew install imagemagick webp libavif)
set -e
SRC="$1"; NAME="$2"
[ -f "$SRC" ] && [ -n "$NAME" ] || { echo "Kullanım: scripts/images.sh kaynak.png adi"; exit 1; }
OUT="$(dirname "$0")/../assets/img"
for W in 480 960 1440; do
  TMP=$(mktemp).png
  magick "$SRC" -strip -resize "${W}x>" "$TMP"
  magick "$TMP" -quality 82 -sampling-factor 4:2:0 "$OUT/$NAME-$W.jpg"
  cwebp -quiet -q 78 "$TMP" -o "$OUT/$NAME-$W.webp"
  avifenc --min 0 --max 63 -a end-usage=q -a cq-level=28 -a tune=ssim -s 5 "$TMP" "$OUT/$NAME-$W.avif" >/dev/null
  rm -f "$TMP"
  echo "  $NAME-$W: jpg $(stat -f%z "$OUT/$NAME-$W.jpg") · webp $(stat -f%z "$OUT/$NAME-$W.webp") · avif $(stat -f%z "$OUT/$NAME-$W.avif") bayt"
done
echo "HTML: <picture> içinde srcset olarak $NAME-480/960/1440 kullan; <img> için $NAME-960.jpg"
