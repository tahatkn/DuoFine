# Cloudflare: güvenlik başlıkları ve önbellek kuralları

Bu iki madde (K-02 ve P-11) depodan uygulanamaz — barındırma katmanında
ayarlanır. Site **GitHub Pages** üzerinde ve önünde **Cloudflare** var
(`server: cloudflare` + `x-github-request-id`), dolayısıyla doğru yer Cloudflare.

GitHub Pages `_headers` ve `_redirects` dosyalarını okumaz. Depodaki `_headers`
yalnızca ileride Netlify/Cloudflare Pages'e taşınırsa geçerli olur.

---

## 1. Güvenlik başlıkları — Response Header Transform Rules

> **Dikkat — sayfada iki benzer bölüm var:**
> `Request Header Transform Rules` tarayıcının sunucuya **gönderdiği** başlıkları
> değiştirir. Bize gereken bu değil.
> Aşağı inip **`Response Header Transform Rules`** bölümünü bulun — sunucunun
> tarayıcıya **döndürdüğü** başlıklar orada ayarlanır. Güvenlik başlıklarının
> hepsi response başlığıdır.

**Cloudflare Dashboard → duofine.com → Rules → Overview →
`Response Header Transform Rules` → Create rule**

- Rule name: `security-headers`
- If: `Hostname equals duofine.com`  (veya "All incoming requests")
- Then: her satır için **Set static** seçip aşağıdaki başlıkları ekleyin.

| Header | Value |
|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()` |
| `X-Frame-Options` | `DENY` |
| `Cross-Origin-Opener-Policy` | `same-origin` |

`frame-ancestors` ve HSTS yalnızca gerçek başlık olarak çalışır; bu yüzden
`<meta>` ile verilemezler ve bu adım atlanamaz.

### CSP hakkında

`index.html`, `/blog/*` ve `404.html` sayfalarına `<meta http-equiv>` ile
çalışan bir CSP zaten eklendi — o kadarı bugün canlıda geçerli.
İsterseniz aynı politikayı burada başlık olarak da verebilirsiniz
(başlık sürümü `frame-ancestors` da içerebildiği için daha güçlüdür):

```
Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://www.googletagmanager.com https://*.google-analytics.com; font-src 'self'; connect-src 'self' https://formsubmit.co https://cloudflareinsights.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com; form-action 'self' https://formsubmit.co; upgrade-insecure-requests
```

> **Dikkat:** CSP'yi başlık olarak verirken `/privacypolicy` ve CG hesap
> sayfalarını da kapsayacağını unutmayın. O sayfalar `style.css` + kendi satır
> içi `<style>` bloklarını kullanıyor; yukarıdaki politika `style-src
> 'unsafe-inline'` içerdiği için onları bozmaz. Yine de yayına aldıktan sonra
> `/privacypolicy` sayfasını bir kez açıp konsolu kontrol edin.

---

## 2. Önbellek — Cache Rules

GitHub Pages her şeye sabit `cache-control: max-age=600` veriyor ve Cloudflare
şu anda HTML'i önbelleğe bile almıyor (`cf-cache-status: DYNAMIC`).

**Rules → Overview → `Cache Rules` → Create rule**

> **Mevcut kuralınıza dokunmayın.** Halihazırda `Cache Backblaze Files` adında,
> `media.duofine.com` için çalışan aktif bir kural var. Aşağıdakileri **yeni**
> kurallar olarak ekleyin. Cache Rules sırayla değerlendirilir; yeni kurallar
> yalnızca `duofine.com` altındaki yollarla eşleştiği için mevcut kuralla
> çakışmaz, ama yine de onu listede **birinci sırada** bırakın.

### Kural A — `assets-immutable`
- If: `URI Path starts with /assets/`
- Then:
  - Cache eligibility: **Eligible for cache**
  - Edge TTL: **Override origin → 1 year**
  - Browser TTL: **Override origin → 1 year**

`/assets/` altındaki her şey (fontlar, AVIF/WebP görseller, ikonlar) içerik
bazında sabittir; değişirse yeni dosya adıyla eklenir.

### Kural B — `html-short`
- If: `URI Path ends with /` or `URI Path ends with .html`
- Then:
  - Cache eligibility: **Eligible for cache**
  - Edge TTL: **Override origin → 1 hour**
  - Browser TTL: **Override origin → 0 (no-cache)**

Böylece HTML kenarda önbelleklenir ama tarayıcı her zaman tazeliğini doğrular —
içerik güncellemesi anında yayılır.

> `/assets/` dışındaki `site.css` ve `script.js` bilerek uzun TTL almıyor;
> derleme adımı olmadığı için içerik hash'li ad taşımıyorlar. İleride hash'li
> adlara geçilirse onları da Kural A'ya taşıyın.

---

## 3. Uyguladıktan sonra doğrulama

```bash
curl -sI https://duofine.com/ | grep -iE 'strict-transport|x-content-type|referrer-policy|permissions-policy|x-frame'
curl -sI https://duofine.com/assets/img/og-image.png | grep -i cache-control
curl -sI https://duofine.com/privacypolicy | head -1   # 200 dönmeli
```

---

## 4. ÖNEMLİ: `site.css` veya `script.js` her değiştiğinde

GitHub Pages bu iki dosyaya **`max-age=14400`** (4 saat) veriyor. Yani dosyayı
güncelleyip push etseniz bile, siteyi daha önce açmış ziyaretçiler 4 saat
boyunca eski sürümü görmeye devam eder.

Bunu aşmak için HTML'deki bağlantılarda sürüm damgası var:

```html
<link rel="stylesheet" href="/site.css?v=20260822">
<script src="/script.js?v=20260822" defer></script>
```

**`site.css` veya `script.js`'i her değiştirdiğinizde bu tarihi güncelleyin.**
Beş dosyada geçiyor: `index.html`, `blog/index.html`,
`blog/postgresql-700ms-to-38ms/index.html`, `404.html`, `blog.html`.

Tek komutla:

```bash
NEW=$(date +%Y%m%d)
sed -i '' -E "s|(site\.css\|script\.js)\?v=[0-9]+|\1?v=$NEW|g" \
  index.html blog/index.html blog/postgresql-700ms-to-38ms/index.html 404.html blog.html
```

HTML'in kendisi `max-age=600` (10 dakika) olduğu için yeni bağlantı en geç
10 dakikada yayılır. Bölüm 2'deki Cache Rules uygulandığında bu süreyi de
kontrol altına alırsınız.
