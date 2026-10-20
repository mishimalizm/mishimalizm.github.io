/* Общие хелперы, шапка, тема, модуль, оверлей сетки. */
(function () {
  const MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  const MONTHS_SHORT = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const now = new Date();
  const NOW = { y: now.getFullYear(), m: now.getMonth() + 1 };

  // "2025-03" → { y: 2025, m: 3 }; null → текущий месяц
  const ym = (s) => (s ? { y: +s.slice(0, 4), m: +s.slice(5, 7) } : { ...NOW });
  const idx = (p) => p.y * 12 + (p.m - 1);
  const months = (p) => idx(ym(p.end)) - idx(ym(p.start)) + 1;

  // Срок: "6 мес" / "сейчас"
  const term = (p) => (p.end ? months(p) + " мес" : "сейчас");

  // Период: "мар 2025 — июл 2025"
  function period(p) {
    const a = ym(p.start), b = p.end ? ym(p.end) : null;
    const f = (x) => MONTHS_SHORT[x.m - 1] + " " + x.y;
    if (b && idx(a) === idx(b)) return f(a);
    return f(a) + " — " + (b ? f(b) : "сейчас");
  }

  // Собранный сайт (_site, window.STATIC) — чистые адреса work/<slug>/; локально — project.html?p=<slug>
  const href = (p) => p.href || (window.STATIC ? "work/" + encodeURIComponent(p.slug) + "/" : "project.html?p=" + encodeURIComponent(p.slug));
  const external = (p) => !!p.href;

  // Тип проекта словами: "мобайл, веб"
  const types = (p) => (p.d || []).map((k) => window.DISCIPLINES[k]?.label || k).join(", ");

  /* ---------- Медиа ----------
     Картинка, видео (вместо gif) или серый плейсхолдер с пропорцией.
     item: { src, ratio: "4 / 5", video, poster, alt, caption, snap: false } */
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function media(item = {}, label) {
    const ratio = item.ratio ? `--ratio:${esc(item.ratio)}` : "";
    const nosnap = item.snap === false ? " data-nosnap" : "";
    if (!item.src) {
      const r = item.ratio || "4 / 3";
      return `<div class="ph" style="--ratio:${esc(r)}"${nosnap}>${esc(label ?? (item.video ? "video " : "") + r.replace(/\s/g, ""))}</div>`;
    }
    if (item.video || /\.(mp4|webm)$/i.test(item.src)) {
      return `<video class="media" style="${ratio}" src="${esc(item.src)}"${item.poster ? ` poster="${esc(item.poster)}"` : ""} ${still ? "controls" : "autoplay"} muted loop playsinline${nosnap}></video>`;
    }
    return `<img class="media" style="${ratio}" src="${esc(item.src)}" alt="${esc(item.alt || item.caption || "")}" loading="lazy" decoding="async"${nosnap}>`;
  }

  /* ---------- Привязка медиа к модулю ----------
     Высота = целое число модулей --u (кроп object-fit: cover ≤ полмодуля).
     Если под картинкой подпись — картинка + отступ до подписи = целое число модулей,
     чтобы текст подписи встал на модульную линию. */
  const unit = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--u")) || 20;

  function ratioOf(el) {
    const r = el.style.getPropertyValue("--ratio");
    if (r) {
      const [a, b] = r.split("/").map(Number);
      if (a && b) return a / b;
    }
    if (el.naturalWidth) return el.naturalWidth / el.naturalHeight;
    if (el.videoWidth) return el.videoWidth / el.videoHeight;
    return 0;
  }

  function snap(root = document) {
    const u = unit();
    root.querySelectorAll(".media, .ph").forEach((el) => {
      if (el.hasAttribute("data-nosnap")) return;
      const w = Math.round(el.getBoundingClientRect().width), r = ratioOf(el); // целые px: одинаковые пропорции в ряду → одинаковая высота
      if (!w || !r) return;
      const cap = el.nextElementSibling;
      const gap = cap && cap.offsetHeight ? u / 2 : 0;
      el.style.height = Math.max(u, Math.round((w / r + gap) / u) * u - gap) + "px";
    });
  }

  // Перепривязать, когда загрузятся картинки без заданной пропорции
  function onMediaReady(root, fn) {
    root.querySelectorAll("img.media").forEach((img) => { if (!img.complete) img.addEventListener("load", fn, { once: true }); });
    root.querySelectorAll("video.media").forEach((v) => v.addEventListener("loadedmetadata", fn, { once: true }));
  }

  /* ---------- Шапка в одну строку: имя | разделы | отображение ----------
     Десктоп: Михаил Никулин 1–4 | Работы, По годам, Обо мне с колонки 5 | − +, ◐ у правого края 11–12.
     Планшет: 1–2 | 3–6 | 7–8. Мобильный: «имя … − + ◐» / разделы.
     На главной «Работы» (сетка, стартовый вид) / «По годам» (календарь) переключают вид,
     на других страницах ведут на него. − + (зум) — только в «Работах». */
  function header({ page } = {}) {
    const S = window.SITE;
    if (page === "index") document.title = `${S.name} — ${S.role}`;
    if (page === "info") document.title = `Обо мне — ${S.name}`;

    const views = page === "index"
      ? `<button type="button" class="btn" data-view="grid" aria-pressed="true">Работы</button>
         <button type="button" class="btn" data-view="calendar" aria-pressed="false">По годам</button>`
      : `<a href="index.html">Работы</a>
         <a href="index.html?view=calendar">По годам</a>`;

    const zoom = page === "index" ? `
         <span class="header__zoom" data-zoom-controls hidden>
           <button type="button" class="btn icon" data-zoom="-1" aria-label="Мельче" title="Мельче">−</button>
           <button type="button" class="btn icon" data-zoom="1" aria-label="Крупнее" title="Крупнее">+</button>
         </span>` : "";

    const el = document.querySelector("[data-header]");
    el.className = "header grid wrap";
    el.innerHTML = `
      <div class="col" style="--d:4;--t:2;--m:2"><a href="index.html">${esc(S.name)}</a></div>
      <nav class="col header__nav" style="--d:6;--t:4;--m:4" aria-label="Разделы">${views}
        <a href="info.html"${page === "info" ? ' class="is-active" aria-current="page"' : ""}>Обо мне</a>
      </nav>
      <div class="col header__tools" style="--d:2;--t:2;--ms:3;--m:2">${zoom}
        <button type="button" class="btn icon" data-theme-toggle aria-label="Сменить тему" title="Тема">◐</button>
      </div>`;

    el.querySelector("[data-theme-toggle]").addEventListener("click", toggleTheme);

    // Высота шапки: --header-full — для первого экрана главной,
    // --header-h — отступ липкого года в календаре (0, если шапка не липкая)
    new ResizeObserver(() => {
      const root = document.documentElement.style, h = el.offsetHeight;
      root.setProperty("--header-full", h + "px");
      root.setProperty("--header-h", (getComputedStyle(el).position === "sticky" ? h : 0) + "px");
    }).observe(el);
  }

  /* ---------- Хранилище (может быть недоступно) ---------- */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} }
  };

  /* ---------- Тема ---------- */
  const savedTheme = store.get("theme");
  if (savedTheme === "light" || savedTheme === "dark") document.documentElement.dataset.theme = savedTheme;

  function toggleTheme() {
    const root = document.documentElement;
    const isDark = root.dataset.theme
      ? root.dataset.theme === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = isDark ? "light" : "dark";
    store.set("theme", root.dataset.theme);
  }

  /* ---------- Оверлей сетки: клавиша G ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    const o = document.createElement("div");
    o.className = "grid-overlay grid";
    o.setAttribute("aria-hidden", "true");
    o.innerHTML = "<i></i>".repeat(12);
    document.body.appendChild(o);
  });
  addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.("input, textarea")) return;
    if (e.key === "g" || e.key === "G" || e.key === "п" || e.key === "П") document.documentElement.classList.toggle("show-grid");
  });

  window.U = { MONTHS, MONTHS_SHORT, NOW, esc, ym, idx, months, term, period, href, external, types, media, snap, onMediaReady, unit, header, store };
})();
