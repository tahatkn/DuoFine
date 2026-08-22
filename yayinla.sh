#!/bin/bash
# Siteyi yayınla. Kullanım:  ./yayinla.sh "ne değiştirdiğin"
set -e

if [ -z "$1" ]; then
  echo "Kullanım: ./yayinla.sh \"ne değiştirdiğin\""
  echo "Örnek:   ./yayinla.sh \"iletişim metni güncellendi\""
  exit 1
fi

# 1. site.css / script.js sürüm damgasını bugüne çek
NEW=$(date +%Y%m%d%H%M)
sed -i '' -E "s|(site\.css\|script\.js)\?v=[0-9]+|\1?v=$NEW|g" \
  index.html blog/index.html blog/postgresql-700ms-to-38ms/index.html 404.html blog.html
echo "✓ Sürüm damgası: $NEW"

# 2. Gizli dosya kontrolu — repo herkese acik, yanlislikla sir push etmeyelim
RISKLI=$(git status --porcelain | awk '{print $2}' | grep -iE '(^|/)\.env|\.pem$|\.key$|credential|secret|id_rsa' || true)
if [ -n "$RISKLI" ]; then
  echo "DUR — bu dosyalar herkese acik repoya gidecekti:"
  echo "$RISKLI" | sed 's/^/  /'
  echo "Once bunlari .gitignore'a ekle."
  exit 1
fi

# 3. Commit + push
git add -A
git commit -q -m "$1"
git push -q origin main
echo "✓ Push edildi"

echo
echo "SON ADIM — Cloudflare'de cache temizle:"
echo "  Caching → Configuration → Purge Everything"
echo "  https://dash.cloudflare.com/?to=/:account/duofine.com/caching/configuration"
echo
echo "Bunu yapmazsan değişiklik 2 saate kadar gecikir."
