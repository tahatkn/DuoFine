// feed.xml (Atom) — blog/*/index.html meta'larından üretilir.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, SITE, listHtml, read, linkRel, meta, esc, unesc } from "./lib.mjs";

const posts = [];
for (const rel of listHtml()) {
  if (!/^blog\/[^/]+\/index\.html$/.test(rel)) continue;
  const html = read(rel);
  const url = linkRel(html, "canonical");
  const t = unesc(meta(html, "og:title", true) || "");
  const d = unesc(meta(html, "description") || "");
  const published = meta(html, "article:published_time", true);
  const modified = meta(html, "article:modified_time", true) || published;
  const author = meta(html, "article:author", true) || "DuoFine Engineering";
  const tag = meta(html, "article:tag", true);
  if (!url || !t || !published) continue;
  posts.push({ url, t, d, published, modified, author, tag });
}
posts.sort((a, b) => (b.published + b.url).localeCompare(a.published + a.url));
const updated = posts.reduce((m, p) => (p.modified > m ? p.modified : m), "1970-01-01");

const out = [
  '<?xml version="1.0" encoding="utf-8"?>',
  '<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en">',
  "  <title>DuoFine Engineering</title>",
  "  <subtitle>Notes from production — what broke, how it was measured, and what actually fixed it.</subtitle>",
  `  <link href="${SITE}/feed.xml" rel="self" type="application/atom+xml"/>`,
  `  <link href="${SITE}/blog/" rel="alternate" type="text/html"/>`,
  `  <id>${SITE}/blog/</id>`,
  `  <updated>${updated}T00:00:00Z</updated>`,
  `  <icon>${SITE}/assets/img/icon-192.png</icon>`,
  "  <author><name>DuoFine</name><uri>" + SITE + "/</uri></author>",
];
for (const p of posts) {
  out.push("  <entry>");
  out.push(`    <title>${esc(p.t)}</title>`);
  out.push(`    <link href="${p.url}" rel="alternate" type="text/html"/>`);
  out.push(`    <id>${p.url}</id>`);
  out.push(`    <published>${p.published}T00:00:00Z</published>`);
  out.push(`    <updated>${p.modified}T00:00:00Z</updated>`);
  out.push(`    <author><name>${esc(p.author)}</name></author>`);
  if (p.tag) out.push(`    <category term="${esc(p.tag)}"/>`);
  out.push(`    <summary type="text">${esc(p.d)}</summary>`);
  out.push("  </entry>");
}
out.push("</feed>", "");
writeFileSync(join(ROOT, "feed.xml"), out.join("\n"));
console.log(`feed: ${posts.length} yazı`);
