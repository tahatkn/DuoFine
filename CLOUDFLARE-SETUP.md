# Cloudflare'de yapılacaklar

3 iş var. Sırayla.

---

## 1. Güvenlik başlıkları

**Nerede:** Cloudflare → duofine.com → Rules → Overview →
**Response** Header Transform Rules → Create rule

> Yukarıda bir de "**Request** Header Transform Rules" var. O değil. Response olan.

**Rule name:** `security-headers`

**If:** Field `Hostname` · Operator `equals` · Value `duofine.com`

**Then:** "Modify response header" altında 6 satır ekle. Her biri için **Set static** seç.

| Header name | Value | Ne işe yarar |
|---|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Tarayıcı siteye hep HTTPS ile girer |
| `X-Content-Type-Options` | `nosniff` | Tarayıcı dosya tipini tahmin etmeye çalışmaz |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Başka sitelere gidince tam adres sızmaz |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()` | Kamera/mikrofon/konumu tamamen kapatır (boş parantez = kimse kullanamaz) |
| `X-Frame-Options` | `DENY` | Siten başkasının sayfasına iframe olarak gömülemez |
| `Cross-Origin-Opener-Policy` | `same-origin` | Sekmeni açan başka siteler sana müdahale edemez |

**Deploy**'a bas.

---

## 2. Önbellek kuralları

**Nerede:** Rules → Overview → Cache Rules → Create rule

> Sende zaten `Cache Backblaze Files` diye aktif bir kural var. **Ona dokunma.**
> Aşağıdakileri yeni kural olarak ekle, onu listede 1. sırada bırak.

### Kural A
- **Name:** `assets-immutable`
- **If:** Field `URI Path` · Operator `starts with` · Value `/assets/`
- **Then:**
  - Cache eligibility → **Eligible for cache**
  - Edge TTL → Override origin → **1 year**
  - Browser TTL → Override origin → **1 year**

### Kural B
- **Name:** `html-short`
- **If:** Field `URI Path` · Operator `ends with` · Value `.html`
  → sonra **Or** → Field `URI Path` · Operator `ends with` · Value `/`
- **Then:**
  - Cache eligibility → **Eligible for cache**
  - Edge TTL → Ignore cache-control header → **2 hours**
    (ücretsiz planda en düşük seçenek bu, sorun değil)
  - Browser TTL → **Respect origin TTL**

Her ikisine de **Deploy**.

### Bu kuraldan sonra: her push'tan sonra cache temizle

Kural B, HTML'i Cloudflare'de 2 saat tutar. Yani siteye bir değişiklik
push ettiğinde ziyaretçilere ulaşması 2 saati bulabilir.

Her push'tan sonra: **Caching → Configuration → Purge Everything**

Tek tık. Değişiklik anında yayılır.

---

## 3. Sitede bir değişiklik yaptığında

Terminalde proje klasöründe:

```bash
./yayinla.sh "ne değiştirdiğin"
```

Bu script 3 şeyi yapar:
1. `site.css` / `script.js` sürüm damgasını günceller (yoksa ziyaretçiler eski
   halini görmeye devam eder)
2. Commit + push
3. Sana Cloudflare cache temizleme linkini verir

Son adımı atlama: **Caching → Configuration → Purge Everything**

---

## Kontrol

1. ve 2. adımdan sonra terminalde:

```bash
curl -sI https://duofine.com/ | grep -i "strict-transport\|x-frame\|referrer-policy"
```

Üç satır görünüyorsa oldu.

---

## Not: CSP neden burada yok

CSP (hangi kodun çalışabileceğini kısıtlayan kural) zaten sayfaların içine
gömülü ve çalışıyor. Ekstra bir şey yapman gerekmiyor.

Sadece iki kural HTML içine gömülemiyor, sunucudan gelmesi şart: **HSTS** ve
**iframe koruması**. Onları da yukarıdaki 1. adımda `Strict-Transport-Security`
ve `X-Frame-Options` olarak ekliyorsun. Bu yüzden 1. adım atlanamaz.
