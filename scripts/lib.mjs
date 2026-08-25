// Ortak yardımcılar — scripts/* tarafından kullanılır. Bağımlılık yok.
import { readdirSync, statSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const SITE = "https://duofine.com";

const SKIP_DIRS = new Set([".git", "node_modules", "partials", "scripts", ".lighthouse"]);

/** Depodaki tüm HTML dosyaları (kök-göreli, "/" ayraçlı). */
export function listHtml(dir = ROOT) {
  const out = [];
  (function walk(d) {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      const st = statSync(p);
      if (st.isDirectory()) { if (!SKIP_DIRS.has(name)) walk(p); }
      else if (name.endsWith(".html")) out.push(relative(ROOT, p).split(sep).join("/"));
    }
  })(dir);
  return out.sort();
}

export function read(rel) { return readFileSync(join(ROOT, rel), "utf8"); }

/** Dosya yolundan sitedeki URL yolu: index.html → /, blog/x/index.html → /blog/x/, foo.html → /foo.html */
export function urlOf(rel) {
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) return "/" + rel.slice(0, -"index.html".length);
  return "/" + rel;
}

export function attr(tag, name) {
  const m = tag.match(new RegExp("\\s" + name + "\\s*=\\s*(\"([^\"]*)\"|'([^']*)'|([^\\s>]+))", "i"));
  return m ? (m[2] ?? m[3] ?? m[4]) : null;
}

export function meta(html, key, byProperty = false) {
  const re = new RegExp("<meta\\s[^>]*" + (byProperty ? "property" : "name") + "\\s*=\\s*[\"']" + key.replace(/[:.]/g, "\\$&") + "[\"'][^>]*>", "i");
  const m = html.match(re);
  return m ? attr(m[0], "content") : null;
}

export function linkRel(html, rel) {
  const re = new RegExp("<link\\s[^>]*rel\\s*=\\s*[\"']" + rel + "[\"'][^>]*>", "i");
  const m = html.match(re);
  return m ? attr(m[0], "href") : null;
}

export function title(html) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return m ? m[1].trim() : null;
}

export function lang(html) {
  const m = html.match(/<html\s[^>]*lang\s*=\s*["']([a-zA-Z-]+)["']/i);
  return m ? m[1].toLowerCase() : "en";
}

/** Çalıştırılan satır içi script'ler (src'siz; ld+json hariç). */
export function inlineScripts(html) {
  const out = [];
  const re = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    const attrs = m[1] || "";
    if (/\ssrc\s*=/i.test(attrs)) continue;
    const type = (attr("<script" + attrs + ">", "type") || "").toLowerCase();
    if (type === "application/ld+json" || type === "application/json") continue;
    if (type && type !== "speculationrules" && type !== "module" && type !== "text/javascript") continue;
    out.push({ type, body: m[2] });
  }
  return out;
}

export function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function unesc(s) {
  return String(s).replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
}
