// Yayın öncesi kalite kapısı. Kırmızıda yayinla.sh durur.
//  - iç bağlantılar, çapalar (#id), görseller, srcset dosyaları var mı
//  - ?v= damgaları güncel mi
//  - CSP'li sayfalarda 'unsafe-inline' yok, style="" yok, satır içi script hash'leri doğru
//  - JSON-LD geçerli JSON mu; title / description / canonical / lang var mı
//  - partial işaretleri dolu mu; {{placeholder}} kalmış mı; <img> alt'sız mı
//  - sitemap.xml'deki her adres bir dosyaya karşılık geliyor mu; feed.xml var mı
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, SITE, listHtml, read, urlOf, attr, meta, linkRel, title, inlineScripts } from "./lib.mjs";
import { hashOf, policyFor } from "./stamp.mjs";

const errors = [], warnings = [];
const err = (f, m) => errors.push(`${f}: ${m}`);
const warn = (f, m) => warnings.push(`${f}: ${m}`);

const files = listHtml();
const ids = new Map(); // rel → Set(id)
for (const rel of files) {
  const html = read(rel);
  ids.set(rel, new Set([...html.matchAll(/\sid\s*=\s*["']([^"']+)["']/g)].map((m) => m[1])));
}

/** Site içi yolu dosyaya çevir; bulunamazsa null. */
function resolvePath(p) {
  p = p.split("#")[0].split("?")[0];
  if (p === "" || p === "/") return "index.html";
  if (p.startsWith("/")) p = p.slice(1);
  if (existsSync(join(ROOT, p))) {
    if (p.endsWith("/")) return existsSync(join(ROOT, p, "index.html")) ? p + "index.html" : null;
    return p;
  }
  if (existsSync(join(ROOT, p + ".html"))) return p + ".html";           // GitHub Pages uzantısız
  if (existsSync(join(ROOT, p, "index.html"))) return p + "/index.html"; // /dir → /dir/
  return null;
}

const versions = { "site.css": hashOf("site.css"), "script.js": hashOf("script.js") };

for (const rel of files) {
  const html = read(rel);
  const noindex = /<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html);
  const isStub = rel.startsWith("legal/");

  if (!/<html\s[^>]*lang=/i.test(html)) err(rel, "<html lang> yok");
  if (!title(html)) err(rel, "<title> yok");
  if (!isStub && !noindex && !meta(html, "description")) err(rel, "meta description yok");
  if (!isStub && !noindex && !linkRel(html, "canonical")) err(rel, "canonical yok");
  if (/\{\{[A-Z_:a-z]+\}\}/.test(html)) err(rel, "doldurulmamış {{placeholder}}");

  for (const name of ["header", "footer"]) {
    const open = `<!-- @@${name} -->`, close = `<!-- @@/${name} -->`;
    const a = html.indexOf(open), b = html.indexOf(close);
    if (a !== -1 && b !== -1 && html.slice(a + open.length, b).trim() === "") err(rel, `${name} partial'ı boş — node scripts/partials.mjs çalıştırılmalı`);
  }

  // sürüm damgaları
  for (const m of html.matchAll(/\/(site\.css|script\.js)\?v=([0-9a-zA-Z]+)/g)) {
    if (m[2] !== versions[m[1]]) err(rel, `${m[1]} damgası eski (${m[2]} ≠ ${versions[m[1]]}) — node scripts/stamp.mjs`);
  }

  // CSP
  const cspTag = html.match(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]*)"/i);
  if (cspTag) {
    const policy = cspTag[1];
    if (policy.includes("'unsafe-inline'")) err(rel, "CSP'de 'unsafe-inline' var");
    if (/\sstyle\s*=\s*["']/i.test(html)) err(rel, 'style="" özniteliği var — CSP style-src \'self\' bunu engeller');
    if (/<style[\s>]/i.test(html)) err(rel, "<style> bloğu var — CSP engeller");
    if (policyFor(html) !== policy) err(rel, "CSP hash'leri satır içi script'lerle uyuşmuyor — node scripts/stamp.mjs");
    const firstTag = html.search(/<(script|link|style)[\s>]/i);
    const cspPos = html.search(/<meta\s+http-equiv="Content-Security-Policy"/i);
    const jsClass = html.indexOf('<script>document.documentElement.className+=" js"</script>');
    if (firstTag !== -1 && firstTag < cspPos && firstTag !== jsClass) warn(rel, "CSP meta'sından önce script/link var");
  } else if (!isStub && !/body-status-page/.test(html) && !/privacypolicy|delete-account/.test(rel)) {
    warn(rel, "CSP meta'sı yok");
  }

  // JSON-LD
  for (const m of html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(m[1]); } catch (e) { err(rel, "JSON-LD geçersiz: " + e.message); }
  }

  // img alt
  for (const m of html.matchAll(/<img\s[^>]*>/gi)) {
    if (!/\salt\s*=/.test(m[0])) err(rel, "alt'sız <img>: " + m[0].slice(0, 80));
  }

  // bağlantılar ve kaynaklar
  const refs = [];
  for (const m of html.matchAll(/\s(?:href|src|poster)\s*=\s*["']([^"']+)["']/gi)) refs.push(m[1]);
  for (const m of html.matchAll(/\ssrcset\s*=\s*["']([^"']+)["']/gi)) for (const part of m[1].split(",")) refs.push(part.trim().split(/\s+/)[0]);
  for (const m of html.matchAll(/<meta\s[^>]*content\s*=\s*["'](https:\/\/duofine\.com\/[^"']+)["']/gi)) refs.push(m[1]);
  for (let ref of refs) {
    if (!ref || ref.startsWith("mailto:") || ref.startsWith("tel:") || ref.startsWith("data:") || ref.startsWith("javascript:")) continue;
    if (ref.startsWith(SITE)) ref = ref.slice(SITE.length) || "/";
    if (/^(https?:)?\/\//.test(ref)) continue; // dış bağlantı
    if (ref.startsWith("#")) {
      const id = decodeURIComponent(ref.slice(1));
      if (id && !ids.get(rel).has(id)) err(rel, `sayfa içi çapa bulunamadı: #${id}`);
      continue;
    }
    // göreli (kök değil) yollar: sayfanın dizinine göre
    let path = ref;
    if (!path.startsWith("/")) {
      const dir = rel.includes("/") ? rel.slice(0, rel.lastIndexOf("/") + 1) : "";
      path = "/" + dir + path;
    }
    const target = resolvePath(path);
    if (!target) { err(rel, `bağlantı hedefi yok: ${ref}`); continue; }
    const hash = ref.includes("#") ? ref.split("#")[1] : "";
    if (hash && ids.has(target) && !ids.get(target).has(decodeURIComponent(hash))) err(rel, `çapa hedefte yok: ${ref}`);
  }
}

// sitemap
if (existsSync(join(ROOT, "sitemap.xml"))) {
  const sm = readFileSync(join(ROOT, "sitemap.xml"), "utf8");
  for (const m of sm.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const u = m[1].replace(SITE, "") || "/";
    if (!resolvePath(u)) err("sitemap.xml", "dosyası olmayan adres: " + m[1]);
  }
} else err("sitemap.xml", "yok — node scripts/sitemap.mjs");
if (!existsSync(join(ROOT, "feed.xml"))) err("feed.xml", "yok — node scripts/feed.mjs");
else if (!/<feed[\s>]/.test(readFileSync(join(ROOT, "feed.xml"), "utf8"))) err("feed.xml", "Atom <feed> kökü yok");

for (const f of ["favicon.ico", "assets/img/icon-maskable-512.png", "assets/img/og-image.png"]) {
  if (!existsSync(join(ROOT, f))) err(f, "eksik");
}

for (const w of warnings) console.log("  uyarı  " + w);
for (const e of errors) console.log("  HATA   " + e);
console.log(`check: ${files.length} sayfa · ${errors.length} hata · ${warnings.length} uyarı`);
process.exit(errors.length ? 1 : 0);
