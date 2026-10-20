/* Внутренняя страница: лонгрид из blocks — осевая композиция.
   Ось — промежуток между служебной колонкой и контентом: 4|5 на десктопе, 2|3 на планшете.
   Слева от оси всё заканчивается на ней и выровнено вправо: метки, ключи меты, подписи, маленькие картинки.
   Справа всё начинается от неё: заголовок, текст (5–9), картинки.
   Ширины картинок — по шкале 2–3–5–8 колонок, 12 — на всю ширину (см. plan()).
   На мобильном оси нет: одна колонка, всё выровнено влево. */
(function () {
  const { esc, ym, idx, period, href, types, media, snap, onMediaReady } = window.U;

  window.U.header({ page: "project" });

  const root = document.querySelector("[data-project]");
  // Какой кейс: на собранном сайте — data-slug страницы work/<slug>/, локально — ?p=<slug>
  const slug = root.dataset.slug || new URLSearchParams(location.search).get("p");
  const list = window.PROJECTS
    .filter((p) => !p.href)
    .sort((a, b) => idx(ym(b.end)) - idx(ym(a.end)) || idx(ym(b.start)) - idx(ym(a.start)));
  const i = list.findIndex((p) => p.slug === slug);

  if (i < 0) {
    root.innerHTML = `<div class="p-head grid"><p class="col">Проект не найден. <a href="index.html">Все работы</a></p></div>`;
    return;
  }
  const p = list[i];
  document.title = `${p.title} — ${window.SITE.name}`;

  /* Колонки страницы */
  const SERVICE = "--ds:1;--d:4;--ts:1;--t:2;--m:4";   // слева от оси: 1–4 / 1–2
  const CONTENT = "--ds:5;--d:8;--ts:3;--t:6;--m:4";   // справа от оси: 5–12 / 3–8
  const TEXT    = "--ds:5;--d:5;--ts:3;--t:6;--m:4";   // текст: 5–9 / 3–8 (~65 знаков)

  /* Шкала ширин справа от оси: колонок на десктопе (из 8) → планшете (из 6) → мобильном (из 4) */
  const RIGHT = { 2: [2, 2, 2], 3: [3, 3, 2], 5: [5, 4, 4], 8: [8, 6, 4] };
  const SCALE = [2, 3, 5, 8];
  const ratio = (r = "4 / 3") => { const [a, b] = String(r).split("/").map(Number); return a && b ? a / b : 4 / 3; };
  const shape = (it) => { const r = ratio(it.ratio); return r > 1.05 ? "land" : r < 0.95 ? "port" : "square"; };
  const toScale = (s) => (s >= 12 ? 12 : SCALE.reduce((a, b) => (Math.abs(b - s) < Math.abs(a - s) ? b : a)));

  /* Раскладка ряда, если у картинок не заданы size / side (заданные важнее):
     1 картинка — горизонтальная: на всю ширину, если это первая картинка кейса, иначе 8;
                  вертикальная — 3, квадратная — 5.
     2 — первая мелко слева от оси (3), вторая крупно справа (горизонтальная 8, иначе 5).
     3 и больше — первая слева от оси (3), остальные справа от неё:
                  вертикальные по 2 (четыре в ряд), остальные 5 + 3, нечётная последняя — 8.
     Лишние картинки переносятся на следующий ряд — тоже от оси. */
  function plan(items, firstMedia) {
    const out = items.map((it) => ({ ...it }));
    if (out.length === 1) {
      const it = out[0];
      it.size ??= shape(it) === "land" ? (firstMedia ? 12 : 8) : shape(it) === "port" ? 3 : 5;
    } else if (out.length > 1) {
      out[0].size ??= 3;
      if (!("side" in items[0])) out[0].side = "left";
      const rest = out.slice(1);
      const portrait = rest.every((it) => shape(it) === "port");
      rest.forEach((it, k) => {
        if (it.size) return;
        if (rest.length === 1) it.size = shape(it) === "land" ? 8 : 5;
        else if (portrait) it.size = 2;
        else it.size = k % 2 ? 3 : k === rest.length - 1 ? 8 : 5;
      });
    }
    for (const it of out) {
      it.size = toScale(it.size);
      if (it.side === "left" && it.size > 4) delete it.side;      // слева от оси помещается не больше 4 колонок
      if (it.size === 12 && out.length > 1) it.size = 8;          // на всю ширину — только одиночная картинка
    }
    return out;
  }

  const paras = (t = "") => t.split(/\n{2,}/).map((x) => `<p>${esc(x)}</p>`).join("");
  const cap = (it) => (it.caption ? `<figcaption>${esc(it.caption)}</figcaption>` : "");
  // Картинка слева от оси: заканчивается на ней. На планшете — поле 1–2, на мобильном — половина или вся ширина
  const leftStyle = (it, s) => `--ds:${5 - s};--d:${s};--ts:1;--t:2;--m:${shape(it) === "land" ? 4 : 2}`;

  function textBlock(b) {
    const a = b.aside ? { ...b.aside } : null;            // деталь на поле под меткой: 2 или 3 колонки
    const s = a ? Math.min(toScale(a.size || 2), 3) : 0;
    return `
      <section class="row block${a ? " block--aside" : ""}">
        ${b.label ? `<h2 class="col block__label" style="${SERVICE}">${esc(b.label)}</h2>` : ""}
        <div class="col block__text" style="${TEXT}">${paras(b.text)}</div>
        ${a ? `<figure class="col block__aside" style="${leftStyle(a, s)}">${media(a)}${cap(a)}</figure>` : ""}
      </section>`;
  }

  function mediaBlock(b, firstMedia) {
    const items = plan(b.items || [], firstMedia);
    if (!items.length) return "";
    // На всю ширину: картинка 1–12, подпись под ней — у оси
    if (items.length === 1 && items[0].size === 12) {
      return `<figure class="row block m-full">${media(items[0])}${cap(items[0])}</figure>`;
    }
    const left = items.find((it) => it.side === "left");
    const right = items.filter((it) => it !== left);
    const single = !left && right.length === 1;              // одиночная картинка: подпись — на поле у оси
    return `
      <section class="row block">
        ${left ? `<figure class="col m-left" style="${leftStyle(left, left.size)}">${media(left)}${cap(left)}</figure>` : ""}
        ${right.length ? `
        <div class="col m-group" style="${CONTENT}">
          ${right.map((it) => { const [d, t, m] = RIGHT[it.size] || RIGHT[8]; return `
            <figure class="col" style="--d:${d};--t:${t};--m:${m}">${media(it)}${single ? "" : cap(it)}</figure>`; }).join("")}
        </div>` : ""}
        ${single && right[0].caption ? `<p class="col m-note" style="${SERVICE}">${esc(right[0].caption)}</p>` : ""}
      </section>`;
  }

  let firstMedia = true;
  function block(b) {
    if (b.type === "text") return textBlock(b);
    if (b.type === "media") { const html = mediaBlock(b, firstMedia); firstMedia = false; return html; }
    return "";
  }

  const metaRow = (k, v) => (v ? `<dt class="col" style="--d:4;--t:2;--m:2">${k}</dt><dd class="col" style="--d:8;--t:6;--m:2">${v}</dd>` : "");
  const next = list[(i + 1) % list.length];

  root.innerHTML = `
    <div class="p-head grid">
      <h1 class="col p-title" style="${CONTENT}">${esc(p.title)}</h1>
      ${p.intro ? `<p class="col" style="${TEXT}">${esc(p.intro)}</p>` : ""}
      <dl class="row p-meta">
        ${metaRow("Клиент", esc(p.client))}
        ${metaRow("Период", esc(period(p)))}
        ${metaRow("Роль", esc(p.role))}
        ${metaRow("Команда", esc((p.team || []).join(", ")))}
        ${metaRow("Тип", esc(types(p)))}
        ${metaRow("Ссылка", p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.url.replace(/^https?:\/\//, ""))}</a>` : "")}
      </dl>
    </div>

    <div class="p-body grid">${(p.blocks || []).map(block).join("")}</div>

    <nav class="p-next grid rule" aria-label="Навигация по проектам">
      <a class="col p-back" href="index.html" style="${SERVICE}">← Все работы</a>
      ${next && next !== p ? `<a class="col" href="${esc(href(next))}" style="${CONTENT}"><span class="caps">Следующий:</span> ${esc(next.title)} →</a>` : ""}
    </nav>`;

  // Картинки — к модулю; при изменении ширины и после загрузки
  const relayout = () => snap(root);
  relayout();
  onMediaReady(root, relayout);
  let raf;
  addEventListener("resize", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(relayout); });
  document.fonts?.ready.then(relayout);
})();
