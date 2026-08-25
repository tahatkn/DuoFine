#!/bin/bash
# Siteyi yayınla.  Kullanım:  ./yayinla.sh "ne değiştirdiğin"
#   ./yayinla.sh --check            → yalnızca derle + kontrol et, commit/push yok
#   ./yayinla.sh --verify           → canlı sözleşme testini çalıştır (purge'den SONRA)
set -e
cd "$(dirname "$0")"

MODE="publish"
case "${1:-}" in
  --check)  MODE="check";;
  --verify) exec scripts/check-contract.sh --smoke;;
  "") echo "Kullanım: ./yayinla.sh \"ne değiştirdiğin\"   |   ./yayinla.sh --check   |   ./yayinla.sh --verify"; exit 1;;
esac

# 1. Gizli dosya kontrolu — repo herkese acik, yanlislikla sir push etmeyelim
RISKLI=$(git status --porcelain | awk '{print $2}' | grep -iE '(^|/)\.env|\.pem$|\.key$|credential|secret|id_rsa' || true)
if [ -n "$RISKLI" ]; then
  echo "DUR — bu dosyalar herkese acik repoya gidecekti:"
  echo "$RISKLI" | sed 's/^/  /'
  echo "Once bunlari .gitignore'a ekle."
  exit 1
fi

# 2. Derleme: ortak parçalar → besleme → sitemap → sürüm damgaları + CSP hash'leri
node scripts/partials.mjs
node scripts/feed.mjs
node scripts/sitemap.mjs
node scripts/og.mjs || echo "  (OG görselleri üretilemedi — Chrome yoksa mevcut görseller kullanılır)"
node scripts/stamp.mjs

# 3. Kalite kapısı — kırmızıda dur
node scripts/check.mjs

if [ "$MODE" = "check" ]; then echo "✓ Kontrol tamam (commit/push yapılmadı)"; exit 0; fi

# 4. Commit + push
git add -A
if [ -n "$(git status --porcelain)" ]; then
  git commit -q -m "$1"
  echo "✓ Commit: $1"
else
  echo "  (yeni değişiklik yok; mevcut commit'ler push edilecek)"
fi
git push -q origin main
echo "✓ Push edildi"

echo
echo "SON ADIM — Cloudflare'de cache temizle:"
echo "  Caching → Configuration → Purge Everything"
echo "  https://dash.cloudflare.com/?to=/:account/duofine.com/caching/configuration"
echo
echo "Purge'den sonra doğrula:  ./yayinla.sh --verify"
echo "Bunu yapmazsan değişiklik 2 saate kadar gecikir."
