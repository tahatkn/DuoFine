#!/bin/bash
# Canlı sözleşme testi — uygulamanın ve mağazaların kullandığı her adres hâlâ çalışıyor mu?
# Kullanım:  scripts/check-contract.sh                 → https://duofine.com
#            scripts/check-contract.sh http://127.0.0.1:8787   (yerel)
#            scripts/check-contract.sh --smoke         → ek olarak headless Chrome ile sahte token akışı (yalnızca canlıda anlamlı)
set -u
BASE="https://duofine.com"; SMOKE=0
for a in "$@"; do case "$a" in --smoke) SMOKE=1;; http*) BASE="${a%/}";; esac; done
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
fail=0; n=0

check() { # url  beklenen_http  beklenen_metin(regex, boş olabilir)
  local url="$1" want="$2" pat="${3:-}"
  local tmp; tmp=$(mktemp)
  local code; code=$(curl -s -m 25 -o "$tmp" -w "%{http_code}" -H "Cache-Control: no-cache" "$BASE$url")
  n=$((n+1))
  if [ "$code" != "$want" ]; then echo "  HATA  $url → http $code (beklenen $want)"; fail=1; rm -f "$tmp"; return; fi
  if [ -n "$pat" ] && ! grep -qE -- "$pat" "$tmp"; then echo "  HATA  $url → içerik işareti yok: $pat"; fail=1; rm -f "$tmp"; return; fi
  echo "  ok    $url"; rm -f "$tmp"
}

echo "Sözleşme testi: $BASE"
# --- uygulamanın canlı akışı (K1 tablosu) ---
check "/activate.html?uid=x&token=y"                          200 'activationScript\.js'
check "/activate.html"                                        200 'activationScript\.js'
check "/email_change.html?uid=x&token=y&new_email=a%40b.co"   200 'emialChangeScript\.js'
check "/password_change.html?uid=x&token=y"                   200 'id="passwordBtn"'
check "/activationScript.js"                                  200 'api\.duofine\.com/user/activate/'
check "/emialChangeScript.js"                                 200 'api\.duofine\.com/user/change_email/'
check "/passwordChangeScript.js"                              200 'api\.duofine\.com/user/change_password/'
check "/delete-account.html"                                  200 'Delete Account|Account deletion'
check "/privacypolicy"                                        200 'legal-lang-block'
check "/privacypolicy?lang=tr"                                200 'data-lang="tr"'
check "/privacypolicy?lang=ar"                                200 'data-lang="ar"'
check "/legal-switcher.js"                                    200 'legal-lang-block'
check "/legal/tr.html"                                        200 'privacypolicy\?lang=tr'
check "/legal/en.html"                                        200 'privacypolicy\?lang=en'
check "/app-ads.txt"                                          200 'pub-'
# --- site ---
check "/"                                                     200 'id="contact"'
check "/tr/"                                                  200 'lang="tr"'
check "/blog/"                                                200 'Notes from production'
check "/blog/postgresql-700ms-to-38ms/"                       200 'Seq Scan'
check "/work/common-ground/"                                  200 'Common Ground'
check "/site.webmanifest"                                     200 'icon-512'
check "/sitemap.xml"                                          200 '<urlset'
check "/feed.xml"                                             200 '<feed'
check "/favicon.ico"                                          200 ''
check "/assets/img/og-image.png"                              200 ''
check "/bu-sayfa-yok-$(date +%s)"                             404 ''

if [ "$SMOKE" = "1" ]; then
  echo "Smoke (headless Chrome): sahte token ile aktivasyon akışı"
  if [ -x "$CHROME" ]; then
    dom=$("$CHROME" --headless=new --disable-gpu --no-first-run --virtual-time-budget=8000 --dump-dom "$BASE/activate.html?uid=x&token=y" 2>/dev/null)
    n=$((n+1))
    if echo "$dom" | grep -q "Activation failed"; then echo "  ok    API'ye ulaşıldı, sunucu sahte token'ı reddetti (beklenen)"
    elif echo "$dom" | grep -q "An error occurred"; then echo "  HATA  fetch başarısız: CSP/CORS/ağ — canlıda olmamalı (yerelde normal)"; fail=1
    elif echo "$dom" | grep -q "Activating your account"; then echo "  HATA  yanıt gelmedi (zaman aşımı)"; fail=1
    else echo "  HATA  beklenmeyen DOM"; fail=1; fi
  else echo "  atlandı: Chrome bulunamadı ($CHROME)"; fi
fi

echo
if [ "$fail" = "0" ]; then echo "✓ $n kontrol, hepsi yeşil"; else echo "✗ kırmızı var — yayın tamamlanmış sayılmaz; gerekirse: git revert HEAD && ./yayinla.sh \"geri al\""; fi
exit $fail
