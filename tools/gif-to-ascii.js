/* GIF → ASCII-кадры для прелоадера.
   Заменяет массив кадров в assets/js/preloader.js (между FRAMES:START и FRAMES:END).

   Нужен Playwright (браузер раскладывает GIF на кадры):
     npm i -D playwright && npx playwright install chromium
   Запуск из папки проекта:
     node tools/gif-to-ascii.js путь/к/анимации.gif [ширина=100]

   Как считается: кадры обрезаются по общей рамке тёмного (низ кадра — земля и номера — отрезается),
   светлый фон становится пробелом, тёмное раскладывается по шкале из 70 знаков.
   Ниже — настройки тона; текущие подобраны под «Animal Locomotion» Майбриджа. */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const OPT = {
  bg: 190,        // светлее этого — фон (пробел)
  ink: 10,        // темнее этого — самый плотный знак
  gamma: 1.35,    // > 1 — больше средних знаков, светлее фактура
  rampMax: 0.86,  // доля шкалы для самых тёмных мест: не доходить до тяжёлых «$@B»
  bottom: 0.84,   // какую часть кадра по высоте брать (отрезать землю и подписи)
  cell: 0.6       // ширина знака к высоте строки: Plex Mono 0.6em при line-height 1
};
const RAMP = " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";

(async () => {
  const [gif, colsArg] = process.argv.slice(2);
  if (!gif) { console.log("node tools/gif-to-ascii.js анимация.gif [ширина]"); process.exit(1); }
  const COLS = +(colsArg || 100);
  const b = await chromium.launch();
  const p = await b.newPage();
  // ImageDecoder работает только на защищённой странице — подставляем https-адрес
  await p.route("https://local.test/**", (r) => r.fulfill({ contentType: "text/html", body: "<body></body>" }));
  await p.goto("https://local.test/");
  const out = await p.evaluate(async ({ b64, COLS, OPT, RAMP }) => {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const dec = new ImageDecoder({ data: bytes, type: "image/gif" });
    await dec.tracks.ready;
    const frames = [];
    for (let i = 0; i < dec.tracks.selectedTrack.frameCount; i++) frames.push((await dec.decode({ frameIndex: i })).image);
    const W = frames[0].displayWidth, H = frames[0].displayHeight;
    const c = document.createElement("canvas"), x = c.getContext("2d", { willReadFrequently: true });
    const lum = (d, k) => 0.299 * d[k] + 0.587 * d[k + 1] + 0.114 * d[k + 2];
    // общая рамка тёмного по всем кадрам — чтобы лошадь не прыгала
    c.width = W; c.height = H;
    let x0 = W, y0 = H, x1 = 0, y1 = 0;
    for (const fr of frames) {
      x.drawImage(fr, 0, 0); const d = x.getImageData(0, 0, W, H).data;
      for (let yy = 0; yy < Math.floor(H * OPT.bottom); yy++) for (let xx = 0; xx < W; xx++)
        if (lum(d, (yy * W + xx) * 4) < OPT.ink + 30) { x0 = Math.min(x0, xx); x1 = Math.max(x1, xx); y0 = Math.min(y0, yy); y1 = Math.max(y1, yy); }
    }
    const m = 4; x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(W - 1, x1 + m); y1 = Math.min(H - 1, y1 + m);
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1, ROWS = Math.round(COLS * (bh / bw) * OPT.cell);
    c.width = COLS; c.height = ROWS; x.imageSmoothingQuality = "high";
    const ascii = frames.map((fr) => {
      x.fillStyle = "#fff"; x.fillRect(0, 0, COLS, ROWS);
      x.drawImage(fr, x0, y0, bw, bh, 0, 0, COLS, ROWS);
      const d = x.getImageData(0, 0, COLS, ROWS).data, rows = [];
      for (let r = 0; r < ROWS; r++) {
        let s = "";
        for (let col = 0; col < COLS; col++) {
          let v = (OPT.bg - lum(d, (r * COLS + col) * 4)) / (OPT.bg - OPT.ink);
          v = Math.pow(Math.max(0, Math.min(1, v)), OPT.gamma);
          s += v <= 0.02 ? " " : RAMP[Math.round(v * OPT.rampMax * (RAMP.length - 1))];
        }
        rows.push(s.replace(/\s+$/, "") || " ");   // пустая строка — пробел, чтобы высота кадров не прыгала
      }
      return rows.join("\n");
    });
    return { ascii, ROWS };
  }, { b64: fs.readFileSync(gif).toString("base64"), COLS, OPT, RAMP });
  await b.close();

  const file = path.join(__dirname, "../assets/js/preloader.js");
  const js = fs.readFileSync(file, "utf8");
  const a = js.indexOf("/* FRAMES:START"), z = js.indexOf("/* FRAMES:END */");
  if (a < 0 || z < 0) throw new Error("В preloader.js нет меток FRAMES:START / FRAMES:END");
  const head = js.slice(a, js.indexOf("\n", a) + 1);
  const list = out.ascii.map((f) => "    " + JSON.stringify(f)).join(",\n");
  fs.writeFileSync(file, js.slice(0, a) + head + "  const FRAMES = [\n" + list + "\n  ];\n  " + js.slice(z));
  console.log(`Готово: ${out.ascii.length} кадров по ${COLS}×${out.ROWS} знаков → assets/js/preloader.js`);
})();
