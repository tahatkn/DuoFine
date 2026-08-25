// 1) site.css / script.js için içerik hash'li sürüm damgası (?v=xxxxxxxx) — tüm HTML'lerde.
//    Dosya değişmediyse URL değişmez, önbellek bozulmaz.
// 2) CSP meta'sı olan sayfalarda satır içi script hash'lerini yeniden hesaplar ve politikayı yazar.
//    Böylece 'unsafe-inline' gerekmez; script metni değişirse hash de değişir.
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT, listHtml, inlineScripts } from "./lib.mjs";

export const POLICY =
  "default-src 'self'; base-uri 'self'; object-src 'none'; frame-src 'none'; " +
  "script-src 'self' {HASHES} 'inline-speculation-rules' https://www.googletagmanager.com https://static.cloudflareinsights.com; " +
  "style-src 'self'; " +
  "img-src 'self' data: https://www.googletagmanager.com https://*.google-analytics.com; " +
  "font-src 'self'; " +
  "connect-src 'self' https://formsubmit.co https://cloudflareinsights.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com; " +
  "form-action 'self' https://formsubmit.co; " +
  "upgrade-insecure-requests";

export const hashOf = (rel) => createHash("sha256").update(readFileSync(join(ROOT, rel))).digest("hex").slice(0, 8);
export const sha256b64 = (s) => createHash("sha256").update(s, "utf8").digest("base64");

export function policyFor(html) {
  const hashes = inlineScripts(html).map((s) => `'sha256-${sha256b64(s.body)}'`);
  const uniq = [...new Set(hashes)];
  return POLICY.replace("{HASHES}", uniq.join(" ")).replace(/\s{2,}/g, " ");
}

// Yalnızca doğrudan çalıştırıldığında dosyalara yazar (check.mjs bu modülü içe aktarır, yazmaz).
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const versions = { "site.css": hashOf("site.css"), "script.js": hashOf("script.js") };
  let stamped = 0, csp = 0;

  for (const rel of listHtml()) {
    const file = join(ROOT, rel);
    const before = readFileSync(file, "utf8");
    let html = before.replace(/\/(site\.css|script\.js)\?v=[0-9a-zA-Z]+/g, (m, f) => `/${f}?v=${versions[f]}`);
    if (/<meta\s+http-equiv="Content-Security-Policy"/i.test(html)) {
      const policy = policyFor(html);
      html = html.replace(/(<meta\s+http-equiv="Content-Security-Policy"\s+content=")[^"]*(")/i, (m, a, b) => a + policy + b);
      csp++;
    }
    if (html !== before) { writeFileSync(file, html); stamped++; }
  }
  console.log(`stamp: site.css=${versions["site.css"]} script.js=${versions["script.js"]} · ${stamped} dosya yazıldı · ${csp} sayfada CSP yenilendi`);
}
