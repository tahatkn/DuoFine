// Ortak header/footer'ı her sayfaya işler.
// Sayfalar şu işaretleri taşır:  <!-- @@header --> … <!-- @@/header -->   <!-- @@footer --> … <!-- @@/footer -->
// Parça, <html lang="xx"> değerine göre partials/header.xx.html / footer.xx.html'den seçilir (yoksa en).
// <body data-page="blog"> → header'da data-nav="blog" olan bağlantıya aria-current="page" eklenir.
// <body data-lang-switch="/tr/"> yoksa header'daki dil anahtarı kaldırılır.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT, listHtml, lang, attr } from "./lib.mjs";

const NAMES = ["header", "footer"];
let changed = 0, touched = 0;

for (const rel of listHtml()) {
  const file = join(ROOT, rel);
  let html = readFileSync(file, "utf8");
  if (!html.includes("<!-- @@header -->") && !html.includes("<!-- @@footer -->")) continue;
  const lng = lang(html);
  const bodyTag = (html.match(/<body(\s[^>]*)?>/i) || [""])[0];
  const page = attr(bodyTag, "data-page") || "";
  const langSwitch = attr(bodyTag, "data-lang-switch");
  const before = html;

  for (const name of NAMES) {
    const open = `<!-- @@${name} -->`, close = `<!-- @@/${name} -->`;
    const a = html.indexOf(open), b = html.indexOf(close);
    if (a === -1 || b === -1) continue;
    let partialPath = join(ROOT, "partials", `${name}.${lng}.html`);
    if (!existsSync(partialPath)) partialPath = join(ROOT, "partials", `${name}.en.html`);
    let part = readFileSync(partialPath, "utf8").trim();

    if (name === "header") {
      // aktif sayfa
      part = part.replace(/<a([^>]*)\sdata-nav="([^"]+)"([^>]*)>/g, (m, pre, nav, post) => {
        const clean = (pre + post).replace(/\saria-current="[^"]*"/g, "");
        return nav === page ? `<a${clean} data-nav="${nav}" aria-current="page">` : m;
      });
      // dil anahtarı
      if (!langSwitch) part = part.replace(/\s*<a class="lang-switch"[^>]*>[^<]*<\/a>/, "");
      else part = part.replace(/(<a class="lang-switch"[^>]*\shref=")[^"]*(")/, `$1${langSwitch}$2`);
    }
    html = html.slice(0, a + open.length) + "\n" + part + "\n" + html.slice(b);
  }
  touched++;
  if (html !== before) { writeFileSync(file, html); changed++; }
}
console.log(`partials: ${touched} sayfa işlendi, ${changed} güncellendi`);
