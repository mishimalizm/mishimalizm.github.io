/* Главная: календарь + визуальная сетка. */
(function () {
  const { esc, ym, idx, term, types, href, external, media, snap, onMediaReady, unit, MONTHS, NOW, store } = window.U;
  const SITE = window.SITE;
  const ALL = window.PROJECTS;

  // Шапка первой: в ней кнопки видов и зума, которые ниже получают обработчики
  window.U.header({ page: "index" });

  /* ---------- Вид: стартовый — «Работы» (сетка), «По годам» (календарь) — ?view=calendar ---------- */
  const state = { view: new URLSearchParams(location.search).get("view") === "calendar" ? "calendar" : "grid" };
  const syncUrl = () => history.replaceState(null, "", location.pathname + (state.view === "calendar" ? "?view=calendar" : ""));

  // Новые сверху: по месяцу запуска, затем по старту
  const visible = (where) =>
    ALL.filter((p) => (p.show || ["calendar", "grid"]).includes(where))
       .sort((a, b) => idx(ym(b.end)) - idx(ym(a.end)) || idx(ym(b.start)) - idx(ym(a.start)));

  const link = (p, inner) => `<a href="${esc(href(p))}"${external(p) ? ' target="_blank" rel="noopener"' : ""}>${inner}</a>`;
  // В календаре — основной тип (первый в d), чтобы строка оставалась в одну линию;
  // полный список — в карточке сетки и в мете кейса
  const mainType = (p) => window.DISCIPLINES[p.d?.[0]]?.label || "";
  const team = (p) => (p.team?.length ? `<span class="cal-item__team" title="${esc(p.team.join(", "))}">${p.team.length}</span>` : "");

  /* =========================================================
     КАЛЕНДАРЬ
     Десктоп:   месяц 3–4 | проект 5–8 | тип 9 | клиент 10–11 | срок 12
     Планшет:   месяц 1   | проект 2–4 | тип 5 | клиент 6–7   | срок 8
     Мобильный: месяц 1   | проект 2–4, ниже «клиент · тип · срок»
     ========================================================= */
  const cells = (p, top) => `
    <div class="col cal-item__title" style="--d:4;--t:3;--m:3">${link(p, esc(p.title))}${team(p)}</div>
    <div class="col cal-item__type muted" style="--d:1;--t:1">${esc(mainType(p))}</div>
    <div class="col cal-item__client" style="--d:2;--t:2;--m:3${top ? ";--ms:2" : ""}">${esc(p.client || "")}<span class="m-only"> · ${esc(mainType(p))} · ${esc(term(p))}</span></div>
    <div class="col cal-item__term muted" style="--d:1;--t:1">${esc(term(p))}</div>`;

  const itemRow = (p) => `
    <li class="cal-item" data-from="${idx(ym(p.start))}" data-to="${idx(ym(p.end))}" data-slug="${esc(p.slug)}">${cells(p)}</li>`;

  function renderCalendar() {
    const list = visible("calendar");
    const latestEl = document.querySelector("[data-latest]");
    const calEl = document.querySelector("[data-calendar]");
    if (!list.length) { latestEl.innerHTML = calEl.innerHTML = ""; return; }

    latestEl.innerHTML = `<p class="col muted" style="--d:4;--t:1;--m:1">Последнее</p>${cells(list[0], true)}`;

    // Проект стоит в месяце запуска (end); идущий — в текущем месяце
    const byMonth = new Map();
    list.forEach((p) => {
      const k = idx(ym(p.end));
      byMonth.set(k, [...(byMonth.get(k) || []), p]);
    });

    const years = list.flatMap((p) => [ym(p.start).y, ym(p.end).y]);
    const maxY = Math.max(...years), minY = Math.min(...years);
    const desc = SITE.monthOrder !== "asc";
    const showEmpty = SITE.emptyMonths !== false;

    let html = "";
    for (let y = maxY; y >= minY; y--) {
      const lastM = y === NOW.y ? NOW.m : 12;   // будущие месяцы не показываем
      const ms = Array.from({ length: lastM }, (_, i) => i + 1);
      if (desc) ms.reverse();

      const monthsHtml = ms.map((m) => {
        const k = y * 12 + (m - 1);
        const items = byMonth.get(k) || [];
        if (!items.length && !showEmpty) return "";
        return `
          <li class="cal-month rule-soft${items.length ? " has-items" : ""}" data-key="${k}">
            <time class="col cal-month__label" style="--d:2;--t:1;--m:1" datetime="${y}-${String(m).padStart(2, "0")}">${MONTHS[m - 1]}</time>
            ${items.length ? `<ol class="col cal-month__items" style="--d:8;--t:7;--m:3">${items.map(itemRow).join("")}</ol>` : ""}
          </li>`;
      }).join("");
      if (!monthsHtml.trim()) continue;

      html += `
        <section class="cal-year grid rule">
          <h2 class="col cal-year__label" style="--d:2;--t:8;--m:4">${y}</h2>
          <ol class="col cal-months" style="--d:10;--t:8;--m:4">${monthsHtml}</ol>
        </section>`;
    }
    calEl.innerHTML = html;
  }

  /* Наведение: линия по месяцам проекта + превью обложки */
  const peek = document.querySelector("[data-peek]");
  (function bindCalendarHover() {
    const root = document.querySelector('[data-view-panel="calendar"]');
    let current = null;

    root.addEventListener("mouseover", (e) => {
      const row = e.target.closest(".cal-item");
      if (row === current) return;
      clear();
      if (!row) return;
      current = row;
      const from = +row.dataset.from, to = +row.dataset.to;
      root.querySelectorAll(".cal-month").forEach((m) => {
        const k = +m.dataset.key;
        m.classList.toggle("is-span", k >= from && k <= to);
      });
      const p = ALL.find((x) => x.slug === row.dataset.slug);
      peek.innerHTML = media(p.cover, "");
      peek.classList.add("is-on");
    });
    root.addEventListener("mouseleave", clear);
    root.addEventListener("mousemove", (e) => {
      if (!current) return;
      const x = Math.min(e.clientX + 20, innerWidth - peek.offsetWidth - 20);
      const y = Math.min(e.clientY + 20, innerHeight - peek.offsetHeight - 20);
      peek.style.transform = `translate(${x}px, ${y}px)`;
    });
    function clear() {
      current = null;
      root.querySelectorAll(".is-span").forEach((m) => m.classList.remove("is-span"));
      peek.classList.remove("is-on");
    }
  })();

  /* =========================================================
     ВИЗУАЛЬНАЯ СЕТКА
     Уровни зума для каждой ширины: сколько колонок занимает карточка
     и видна ли подпись. Каждый шаг меняет число карточек в ряду.
     ========================================================= */
  const LEVELS = {
    12: [{ span: 1 }, { span: 2 }, { span: 3, cap: true }, { span: 4, cap: true }, { span: 6, cap: true }],
    8:  [{ span: 1 }, { span: 2, cap: true }, { span: 4, cap: true }, { span: 8, cap: true }],
    4:  [{ span: 1 }, { span: 2, cap: true }, { span: 4, cap: true }]
  };
  const DEFAULT_LEVEL = { 12: 3, 8: 1, 4: 1 };   // 3 / 4 / 2 карточки в ряду (десктоп — как в Figma)
  // Ключ сохранённого масштаба. Сменили стандарт на «3 в ряд» — сменили ключ, чтобы старый выбор не перекрывал новый
  const ZOOM_KEY = "grid-zoom-";
  const zoomMem = {};

  const works = document.querySelector("[data-works]");
  const minus = document.querySelector('[data-zoom="-1"]');
  const plus = document.querySelector('[data-zoom="1"]');

  const cols = () => {
    const c = +getComputedStyle(document.documentElement).getPropertyValue("--cols");
    return LEVELS[c] ? c : 12;
  };
  function level(c = cols()) {
    if (zoomMem[c] !== undefined) return zoomMem[c];
    const raw = store.get(ZOOM_KEY + c);
    const v = raw === null ? NaN : +raw;
    return Number.isInteger(v) && v >= 0 && v < LEVELS[c].length ? v : DEFAULT_LEVEL[c];
  }
  function stepZoom(d) {
    const c = cols();
    const i = Math.max(0, Math.min(LEVELS[c].length - 1, level(c) + d));
    zoomMem[c] = i;
    store.set(ZOOM_KEY + c, i);
    applyZoom();
  }
  function applyZoom() {
    const c = cols(), i = level(c), L = LEVELS[c][i];
    works.style.setProperty("--span", L.span);
    works.classList.toggle("no-caption", !L.cap);
    minus.disabled = i <= 0;
    plus.disabled = i >= LEVELS[c].length - 1;
    relayout();
  }

  // Masonry: картинки — к модулю, карточка занимает целое число рядов по --u
  function relayout() {
    if (state.view !== "grid") return;
    snap(works);
    const u = unit();
    works.querySelectorAll(".card").forEach((c) => {
      c.style.gridRowEnd = "span " + Math.max(1, Math.ceil(c.getBoundingClientRect().height / u - 0.05));
    });
  }

  function renderGrid() {
    const list = visible("grid");
    works.innerHTML = list.map((p) => `
      <article class="col card${p.wide ? " is-wide" : ""}">
        ${link(p, `
          ${media(p.cover)}
          <div class="card__caption"><span class="card__title">${esc(p.title)}</span><span class="muted">${ym(p.end).y}</span></div>
          <div class="card__meta">${esc([p.client, types(p)].filter(Boolean).join(" · "))}</div>`)}
      </article>`).join("");
    onMediaReady(works, relayout);
    applyZoom();
  }

  minus.addEventListener("click", () => stepZoom(-1));
  plus.addEventListener("click", () => stepZoom(1));
  addEventListener("keydown", (e) => {
    if (state.view !== "grid" || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "+" || e.key === "=") stepZoom(1);
    if (e.key === "-" || e.key === "_") stepZoom(-1);
  });
  let raf;
  addEventListener("resize", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(applyZoom); });
  document.fonts?.ready.then(relayout);

  /* =========================================================
     ПЕРЕКЛЮЧЕНИЕ ВИДОВ (иконки в шапке)
     ========================================================= */
  function setView(v) {
    state.view = v;
    document.querySelectorAll("[data-view-panel]").forEach((el) => (el.hidden = el.dataset.viewPanel !== v));
    document.querySelectorAll("[data-view]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === v)));
    document.querySelector("[data-zoom-controls]").hidden = v !== "grid";
    applyZoom();
    syncUrl();
  }

  document.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));

  renderCalendar();
  renderGrid();
  setView(state.view);
})();
