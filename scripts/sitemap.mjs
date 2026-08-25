// sitemap.xml'i sayfalardan üretir. Girdi: canonical'ı kendi adresi olan, noindex olmayan HTML'ler.
// lastmod: dosyanın son git commit tarihi; commit edilmemişse bugün.
import { writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { ROOT, SITE, listHtml, read, urlOf, linkRel } from "./lib.mjs";

function lastmod(rel) {
  try {
    const git = (args) => execFileSync("git", args, { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
    const d = git(["log", "-1", "--format=%cs", "--", rel]);
    const dirty = git(["status", "--porcelain", "--", rel]);
    if (d && !dirty) return d;
  } catch {}
  return new Date().toISOString().slice(0, 10);
}

function rank(url) {
  if (url === "/") return ["weekly", "1.0"];
  if (url === "/tr/") return ["weekly", "0.9"];
  if (url === "/blog/") return ["weekly", "0.8"];
  if (url.startsWith("/blog/") || url.startsWith("/work/")) return ["monthly", "0.7"];
  return ["yearly", "0.3"];
}

const alternates = { "/": [["en", "/"], ["tr", "/tr/"], ["x-default", "/"]], "/tr/": [["tr", "/tr/"], ["en", "/"], ["x-default", "/"]] };

const entries = [];
for (const rel of listHtml()) {
  const html = read(rel);
  if (/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html)) continue;
  const canonical = linkRel(html, "canonical");
  if (!canonical || !canonical.startsWith(SITE)) continue;
  const own = urlOf(rel);
  const ownAlt = own.endsWith(".html") ? own.slice(0, -5) : own; // /privacypolicy.html → /privacypolicy
  const path = canonical.slice(SITE.length);
  if (path !== own && path !== ownAlt) continue; // canonical başka yere işaret ediyor (yönlendirme stub'ları)
  const [changefreq, priority] = rank(path);
  entries.push({ loc: canonical, lastmod: lastmod(rel), changefreq, priority, alt: alternates[path] });
}
entries.sort((a, b) => parseFloat(b.priority) - parseFloat(a.priority) || a.loc.localeCompare(b.loc));

const xml = ['<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'];
for (const e of entries) {
  xml.push("  <url>");
  xml.push(`    <loc>${e.loc}</loc>`);
  xml.push(`    <lastmod>${e.lastmod}</lastmod>`);
  xml.push(`    <changefreq>${e.changefreq}</changefreq>`);
  xml.push(`    <priority>${e.priority}</priority>`);
  if (e.alt) for (const [l, p] of e.alt) xml.push(`    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE}${p}"/>`);
  xml.push("  </url>");
}
xml.push("</urlset>", "");
writeFileSync(join(ROOT, "sitemap.xml"), xml.join("\n"));
console.log(`sitemap: ${entries.length} adres`);
