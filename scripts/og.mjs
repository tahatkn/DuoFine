// Sosyal paylaşım (OG) görselleri — headless Chrome ile 1200×630 ekran görüntüsü.
// Şablon sitenin kendi yazı tipini kullanır; depo kökü geçici bir HTTP sunucusundan servis edilir.
// Kullanım: node scripts/og.mjs            → yalnızca eksik olanları üretir
//           node scripts/og.mjs --force    → hepsini yeniden üretir
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync, statSync, unlinkSync } from "node:fs";
import { execFile, execFileSync } from "node:child_process";
// Chrome, bu süreçteki HTTP sunucusundan sayfa ister; bu yüzden Chrome ASENKRON çalıştırılır
// (execFileSync olay döngüsünü kilitler, sunucu yanıt veremez, Chrome sonsuza kadar bekler).
const run = (cmd, args) => new Promise((resolve, reject) => {
  execFile(cmd, args, { timeout: 30000 }, (e) => (e ? reject(e) : resolve()));
});
import { join, extname } from "node:path";
import { ROOT, listHtml, read, linkRel, meta, unesc, esc } from "./lib.mjs";

const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = join(ROOT, "assets", "og");
const force = process.argv.includes("--force");
mkdirSync(OUT, { recursive: true });

// Hangi sayfa hangi görseli kullanıyor: og:image → /assets/og/<slug>.png olanlar
const jobs = [];
for (const rel of listHtml()) {
  const html = read(rel);
  const og = meta(html, "og:image", true) || "";
  const m = og.match(/\/assets\/og\/([a-z0-9-]+)\.(?:png|jpe?g)$/);
  if (!m) continue;
  const slug = m[1];
  const t = unesc(meta(html, "og:title", true) || "");
  let kicker = "duofine.com";
  if (rel.startsWith("blog/") && rel !== "blog/index.html") kicker = "Engineering notes · " + (meta(html, "article:tag", true) || "");
  else if (rel === "blog/index.html") kicker = "Engineering notes";
  else if (rel.startsWith("work/")) kicker = "Case study";
  else if (rel.startsWith("tr/")) kicker = "Ürün mühendisliği stüdyosu";
  const date = meta(html, "article:published_time", true);
  jobs.push({ slug, title: t, kicker, date, rel });
}

const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".woff2": "font/woff2", ".png": "image/png", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".js": "text/javascript" };

function template(job) {
  const len = job.title.length;
  const size = len > 90 ? 44 : len > 60 ? 50 : len > 40 ? 58 : 66;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<style>
@font-face{font-family:Poppins;font-weight:700;src:url(/assets/fonts/poppins-700.woff2) format("woff2")}
@font-face{font-family:Poppins;font-weight:700;src:url(/assets/fonts/poppins-700-ext.woff2) format("woff2");unicode-range:U+0100-02BA,U+1E00-1EFF}
@font-face{font-family:Poppins;font-weight:600;src:url(/assets/fonts/poppins-600.woff2) format("woff2")}
@font-face{font-family:Poppins;font-weight:600;src:url(/assets/fonts/poppins-600-ext.woff2) format("woff2");unicode-range:U+0100-02BA,U+1E00-1EFF}
@font-face{font-family:Poppins;font-weight:400;src:url(/assets/fonts/poppins-400.woff2) format("woff2")}
html,body{margin:0;width:1200px;height:630px;overflow:hidden}
body{font-family:Poppins,Arial,sans-serif;background:#0B1020;color:#fff;position:relative}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:64px 64px;-webkit-mask-image:radial-gradient(ellipse 80% 90% at 85% 50%,#000 20%,transparent 75%)}
.glow{position:absolute;right:-200px;top:-100px;width:900px;height:700px;background:radial-gradient(ellipse at center,rgba(67,100,247,.45),rgba(67,100,247,.12) 45%,transparent 70%)}
.wrap{position:absolute;inset:72px 80px 64px 80px;display:flex;flex-direction:column;justify-content:space-between}
.brand{display:flex;align-items:center;gap:16px;font-weight:700;font-size:34px;letter-spacing:-.02em}
.brand svg{width:44px;height:44px}
.kicker{font-size:20px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#6B87FF;margin-bottom:22px}
h1{margin:0;font-size:${size}px;line-height:1.12;letter-spacing:-.03em;font-weight:700;max-width:960px;text-wrap:balance}
.foot{display:flex;justify-content:space-between;align-items:flex-end;font-size:20px;color:#A8B3D0;font-weight:600}
.rule{width:64px;height:4px;background:#4364F7;border-radius:2px;margin-bottom:26px}
</style></head><body>
<div class="grid"></div><div class="glow"></div>
<div class="wrap">
  <div class="brand"><svg viewBox="0 0 100 100" fill="none" stroke="#4364F7" stroke-width="14" stroke-linecap="round"><path d="M30 85 C 80 85, 80 15, 30 15"/><path d="M70 15 C 20 15, 20 85, 70 85"/></svg>DuoFine</div>
  <div><div class="rule"></div><div class="kicker">${esc(job.kicker)}</div><h1>${esc(job.title)}</h1></div>
  <div class="foot"><span>duofine.com</span><span>${job.date ? esc(job.date) : ""}</span></div>
</div></body></html>`;
}

const server = createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  if (url.startsWith("/__og/")) {
    const job = jobs.find((j) => j.slug === url.slice(6));
    if (!job) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(template(job));
  }
  const file = join(ROOT, url);
  if (!file.startsWith(ROOT) || !existsSync(file) || statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
});

await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;
let made = 0;
try {
  for (const job of jobs) {
    const out = join(OUT, job.slug + ".jpg");
    if (existsSync(out) && !force) continue;
    const tmp = out + ".tmp.png";
    await run(CHROME, [
      "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", "--no-default-browser-check",
      "--window-size=1200,630", "--force-device-scale-factor=1", "--virtual-time-budget=4000",
      `--screenshot=${tmp}`, `http://127.0.0.1:${port}/__og/${job.slug}`
    ]);
    // JPEG q90, 4:4:4 örnekleme: gradyan pürüzsüz, metin keskin, ~70 KB
    try { execFileSync("magick", [tmp, "-strip", "-quality", "90", "-sampling-factor", "4:4:4", "-interlace", "none", out], { stdio: "ignore" }); unlinkSync(tmp); }
    catch { execFileSync("mv", [tmp, out]); }
    made++;
    console.log("og:", job.slug, Math.round(statSync(out).size / 1024) + " KB");
  }
} finally { server.close(); }
console.log(`og: ${made} görsel üretildi (${jobs.length} sayfa OG kullanıyor)`);
