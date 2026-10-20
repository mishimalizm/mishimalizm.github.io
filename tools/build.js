#!/usr/bin/env node
/* Сборка сайта для публикации: node tools/build.js → папка _site/
   Без зависимостей — нужен только Node. Запускается и локально, и в GitHub Actions.

   Что делает:
   - копирует страницы и assets в _site;
   - для каждого кейса собирает страницу work/<slug>/ — с заголовком, описанием,
     превью для мессенджеров (Open Graph) и текстом кейса для поисковиков (noscript);
   - добавляет те же мета-теги главной и «Обо мне»;
   - пишет sitemap.xml, robots.txt, 404.html и .nojekyll.

   Адрес сайта: переменная SITE_URL (её подставляет GitHub Actions) или SITE.url в data.js.
   Без адреса превью ссылок получат неполные пути, а sitemap не соберётся.

   Посмотреть собранный сайт: python3 -m http.server -d _site 8000 → http://localhost:8000 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "_site");
const STATIC_FILES = ["assets", "index.html", "info.html", "project.html"];

// Данные — тот же data.js, что читает браузер
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, "assets/js/data.js"), "utf8"), sandbox);
const { SITE, PROJECTS } = sandbox.window;

const BASE = String(process.env.SITE_URL || SITE.url || "").replace(/\/+$/, "");  // https://user.github.io/repo
const BASE_PATH = BASE ? new URL(BASE + "/").pathname : "/";                       // /repo/ — для страницы 404
const abs = (p = "") => (BASE ? `${BASE}/${p.replace(/^\/+/, "")}` : p);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const write = (f, s) => { fs.mkdirSync(path.dirname(path.join(OUT, f)), { recursive: true }); fs.writeFileSync(path.join(OUT, f), s); };

// Картинка для превью ссылки: обложка кейса → первая картинка кейса → фото из «Обо мне»
const images = (p) => (p.blocks || []).flatMap((b) => [...(b.items || []), ...(b.aside ? [b.aside] : [])]);
const previewImage = (p) => p.cover?.src || images(p).find((it) => it.src && !it.video)?.src || SITE.photo?.src || "";

// Мета-теги страницы + флаг собранного сайта (ссылки на кейсы — work/<slug>/)
function meta({ title, description, url, image, type = "website" }) {
  return [
    description && `<meta name="description" content="${esc(description)}">`,
    url && `<link rel="canonical" href="${esc(url)}">`,
    `<meta property="og:type" content="${type}">`,
    `<meta property="og:site_name" content="${esc(SITE.name)}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    description && `<meta property="og:description" content="${esc(description)}">`,
    url && `<meta property="og:url" content="${esc(url)}">`,
    image && `<meta property="og:image" content="${esc(abs(image))}">`,
    `<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}">`,
    `<script>window.STATIC = true;</script>`
  ].filter(Boolean).map((l) => "  " + l).join("\n");
}

// Готовая страница: старое описание заменяем, остальное добавляем перед </head>
const inject = (html, tags) => html.replace(/\n\s*<meta name="description"[^>]*>/, "").replace("</head>", tags + "\n</head>");
const descriptionOf = (html) => (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";

const fonts = `  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400&display=swap">
  <link rel="stylesheet" href="assets/css/style.css">`;

// Страница кейса: та же разметка, что project.html, но адрес и мета-теги — свои
function workPage(p) {
  const description = p.intro || `${p.title} — ${p.client || SITE.name}`;
  const text = (p.blocks || []).filter((b) => b.type === "text")
    .map((b) => (b.label ? `<h2>${esc(b.label)}</h2>` : "") + String(b.text || "").split(/\n{2,}/).map((x) => `<p>${esc(x)}</p>`).join(""))
    .join("");
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <base href="../../">
  <title>${esc(p.title)} — ${esc(SITE.name)}</title>
${meta({ title: p.title, description, url: BASE && abs(`work/${p.slug}/`), image: previewImage(p), type: "article" })}
${fonts}
</head>
<body>
  <script src="assets/js/preloader.js"></script>
  <header data-header></header>
  <main class="wrap" data-project data-slug="${esc(p.slug)}"></main>
  <noscript><article class="wrap"><h1>${esc(p.title)}</h1>${p.intro ? `<p>${esc(p.intro)}</p>` : ""}${text}</article></noscript>

  <script src="assets/js/data.js"></script>
  <script src="assets/js/common.js"></script>
  <script src="assets/js/project.js"></script>
</body>
</html>
`;
}

const page404 = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <base href="${BASE_PATH}">
  <title>Страница не найдена — ${esc(SITE.name)}</title>
  <meta name="robots" content="noindex">
  <script>window.STATIC = true;</script>
${fonts}
</head>
<body>
  <header data-header></header>
  <main class="wrap">
    <div class="info grid">
      <p class="col muted info__label" style="--ds:1;--d:4;--ts:1;--t:2;--m:4">404</p>
      <p class="col" style="--ds:5;--d:5;--ts:3;--t:6;--m:4">Такой страницы нет. <a class="p-back" href="index.html">← Все работы</a></p>
    </div>
  </main>
  <script src="assets/js/data.js"></script>
  <script src="assets/js/common.js"></script>
  <script>U.header({ page: "404" });</script>
</body>
</html>
`;

// ---- Сборка ----
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const f of STATIC_FILES) fs.cpSync(path.join(ROOT, f), path.join(OUT, f), { recursive: true });
write(".nojekyll", "");

const index = read("index.html");
write("index.html", inject(index, meta({ title: SITE.name, description: descriptionOf(index) || SITE.bio, url: BASE && abs(""), image: SITE.photo?.src })));
write("info.html", inject(read("info.html"), meta({ title: `Обо мне — ${SITE.name}`, description: SITE.bio, url: BASE && abs("info.html"), image: SITE.photo?.src })));
write("project.html", read("project.html").replace("</head>", "  <script>window.STATIC = true;</script>\n</head>"));

const cases = PROJECTS.filter((p) => !p.href);
for (const p of cases) write(`work/${p.slug}/index.html`, workPage(p));
write("404.html", page404);

write("robots.txt", `User-agent: *\nAllow: /\n${BASE ? `Sitemap: ${abs("sitemap.xml")}\n` : ""}`);
if (BASE) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = ["", "info.html", ...cases.map((p) => `work/${p.slug}/`)];
  write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${esc(abs(u))}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>
`);
}

console.log(`Собрано в _site: главная, «Обо мне», ${cases.length} страниц кейсов (work/<slug>/), 404${BASE ? ", sitemap.xml" : ""}, robots.txt.`);
console.log(BASE ? `Адрес сайта: ${BASE}` : "⚠ Адрес сайта не задан (SITE_URL или SITE.url) — превью ссылок без полных адресов, sitemap не собран. На GitHub Pages адрес подставится сам.");
console.log("Посмотреть: python3 -m http.server -d _site 8000 → http://localhost:8000");
