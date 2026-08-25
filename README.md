# duofine.com

Statik site. GitHub Pages barındırır (`main` dalı, kök dizin), Cloudflare önde.
Derleme adımı yok: depodaki HTML olduğu gibi yayınlanır; `scripts/` yalnızca
yayın öncesi ortak parçaları işler ve kontrol eder.

## Yayınlamak

```bash
./yayinla.sh "ne değiştirdiğin"     # derle → kontrol → commit → push
./yayinla.sh --check                # yalnızca derle + kontrol (push yok)
./yayinla.sh --verify               # canlıda sözleşme testi (Cloudflare purge'den SONRA)
```

Push'tan sonra Cloudflare'de **Caching → Configuration → Purge Everything**.
Yapılmazsa HTML 2 saate kadar eski kalır (bkz. `CLOUDFLARE-SETUP.md`).

## Yapı

| Yol | Ne |
|---|---|
| `index.html`, `tr/index.html` | Ana sayfa (EN / TR) |
| `blog/*/index.html` | Mühendislik notları |
| `work/*/index.html` | Vaka çalışmaları |
| `privacypolicy.html` | Kullanım koşulları + gizlilik, 16 dil tek sayfada (`legal-switcher.js`) |
| `delete-account.html` | Google Play hesap silme adresi |
| `activate.html`, `email_change.html`, `password_change.html` | Common Ground uygulamasının e-posta akışları — **canlı**; aşağıya bak |
| `legal/*.html` | Eski `/legal/xx.html` adreslerinden yönlendirme stub'ları |
| `partials/` | Ortak header/footer (EN/TR); sayfalara `<!-- @@header -->` işaretleriyle işlenir |
| `site.css`, `script.js` | Tek stil, tek script; URL'leri içerik hash'iyle damgalanır |
| `assets/img`, `assets/fonts`, `assets/og` | Görseller, self-hosted Poppins, üretilen OG görselleri |
| `scripts/` | `partials`, `stamp` (hash + CSP), `check`, `sitemap`, `feed`, `og`, `images.sh`, `check-contract.sh` |

`_headers` ve `_redirects` GitHub Pages'te **çalışmaz**; barındırma taşınırsa diye duruyorlar.
`style.css` ve `favicon.png` artık hiçbir sayfa tarafından kullanılmıyor; Cloudflare önbelleği
boşaldıktan sonra (bir sonraki yayında) silinebilir.

## Uygulamanın canlı sayfaları — dokunmadan önce oku

`activate.html`, `email_change.html`, `password_change.html` ve script'leri
(`activationScript.js`, `emialChangeScript.js`, `passwordChangeScript.js`) mağazadaki
uygulamanın e-posta bağlantılarından açılır. Kurallar:

- URL, dosya adı ve sorgu parametreleri (`uid`, `token`, `new_email`) değişmez.
- Script'ler ve API çağrıları değişmez; sayfalar yalnızca `head`, CSS ve etiket düzeyinde yenilenir.
  Script'lerin dayandığı `#passwordOne #passwordTwo #passwordBtn #resultText .status-container .status-icon` korunur.
- Bu sayfalara CSP meta'sı eklenmez (yanlış bir `connect-src` aktivasyonu sessizce bloklar).
- Her yayından sonra `./yayinla.sh --verify` (sahte token'la canlı akış; sunucu 400 döner, "Activation failed." görünmeli).
- Geri alma: `git revert HEAD && ./yayinla.sh "geri al"` + purge.

`api.duofine.com` yalnızca `https://duofine.com` origin'ine CORS izni verir; bu yüzden fetch
akışı yerelde çalışmaz, yalnızca canlıda doğrulanır.

## Yeni bir sayfa eklerken

1. Mevcut bir sayfayı kopyala; `<body data-page="…">`, `canonical`, `og:*` ve JSON-LD'yi güncelle.
2. Header/footer'ı elle yazma — `<!-- @@header --><!-- @@/header -->` işaretlerini bırak.
3. OG görseli için `og:image`'i `/assets/og/<slug>.png` yap; `scripts/og.mjs` üretir.
4. Yeni raster görsel: `scripts/images.sh kaynak.png adi` → `<picture>` ile kullan.
5. `./yayinla.sh --check` yeşil olana kadar yayınlama.
