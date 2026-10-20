/* =========================================================
   ДАННЫЕ САЙТА — единственный файл, который нужно править.
   ========================================================= */

window.SITE = {
  name: "Михаил Никулин",
  // Адрес сайта без слэша на конце — для превью ссылок и sitemap. На GitHub Pages
  // подставляется сам при сборке; заполнить, только если подключишь свой домен
  url: "",
  role: "дизайнер",          // для заголовка вкладки
  email: "hello@example.com",
  links: [
    { label: "Telegram", href: "https://t.me/username" },
    { label: "Instagram", href: "https://instagram.com/username" }
  ],
  // Фото и био — на странице «Инфо», раздел «Обо мне»
  // hover — второе фото: при наведении (на телефоне — по тапу)
  photo: { src: "assets/img/me.jpg", ratio: "3 / 4", hover: "assets/img/me-smile.jpg" },
  bio: "Разрабатываю дизайн цифровых продуктов под веб и мобильные платформы, люблю навалить визуального мяса и томно потягивать тикеты с доски задач под трип-хоп, даб и эмбиент.",
  // Порядок месяцев внутри года: "asc" — январь → декабрь, "desc" — наоборот
  monthOrder: "desc",
  // Пустые месяцы в календаре: true — показывать все (как у Haiss), false — только с проектами
  emptyMonths: true
};

// Тип проекта: ключ → слово в календаре, сетке и кейсе
window.DISCIPLINES = {
  web:     { label: "веб" },
  mobile:  { label: "мобайл" },
  graphic: { label: "графика" }
};

/* ---------------------------------------------------------
   ПРОЕКТ
   slug        — адрес: project.html?p=slug
   title       — название
   client      — клиент / контекст
   d           — тип: ["web", "mobile", "graphic"], выводится словами;
                 первый — основной, его показывает календарь
   start, end  — "ГГГГ-ММ". В календаре проект стоит в месяце end
                 (запуск), при наведении подсвечиваются все месяцы.
                 end: null — проект идёт сейчас.
   team        — соавторы (число в календаре, имена в подсказке)
   role        — роль
   url         — внешняя ссылка (живой сайт, App Store)
   href        — если нет лонгрида: ссылка вместо внутренней страницы
   cover       — { src, ratio } обложка; без src — серый плейсхолдер
   wide        — двойная ширина карточки в визуальной сетке
   show        — ["calendar", "grid"] где показывать (по умолчанию оба)
   intro       — лид лонгрида
   blocks      — тело лонгрида: text { label, text, aside } и media { items: [{ src, ratio, caption, size, side }] }.
                 Без size / side раскладка подбирается сама по числу и ориентации картинок (см. README)
   --------------------------------------------------------- */

window.PROJECTS = [
  {
    slug: "bank-app",
    title: "Мобильный банк для малого бизнеса",
    client: "Банк",
    d: ["mobile", "web"],
    start: "2026-03", end: null,
    team: ["Аналитик", "Продакт", "2 разработчика"],
    role: "Ведущий дизайнер",
    cover: { src: "", ratio: "4 / 5" },
    intro: "Переосмыслили ежедневные операции предпринимателя: платежи, счета и налоги в одном приложении.",
    blocks: [
      { type: "text", label: "01 Контекст", text: "Здесь контекст: кто пользователь, какая была проблема, какие метрики хотели сдвинуть.\n\nВторой абзац — ограничения и вводные." },
      // первая картинка кейса, горизонтальная — сама встанет на всю ширину
      { type: "media", items: [{ src: "", ratio: "16 / 9", caption: "Главный экран, обзор" }] },
      { type: "text", label: "02 Исследование", text: "Что узнали из интервью и аналитики. Ключевые инсайты коротко." },
      // первая в ряду — ключевая: крупно слева от оси, остальные мелко справа
      { type: "media", items: [
        { src: "", ratio: "9 / 19.5", caption: "Главная" },
        { src: "", ratio: "9 / 19.5", caption: "Вход" },
        { src: "", ratio: "9 / 19.5", caption: "Платёж" },
        { src: "", ratio: "9 / 19.5", caption: "Успех" }
      ] },
      // aside — деталь на поле под меткой раздела
      { type: "text", label: "03 Решение", text: "Как устроено решение и почему так.", aside: { src: "", ratio: "1 / 1", caption: "Деталь: кнопка оплаты" } },
      // size — ширина из шкалы 2 / 3 / 5 / 8 / 12, если автоматическая не подходит
      { type: "media", items: [{ src: "", ratio: "16 / 10", video: true, caption: "Сценарий оплаты (mp4 вместо gif)", size: 5 }] },
      { type: "media", items: [
        { src: "", ratio: "4 / 3", caption: "Было" },
        { src: "", ratio: "4 / 3", caption: "Стало" }
      ] },
      { type: "text", label: "04 Результат", text: "Цифры и выводы." }
    ]
  },
  {
    slug: "crm-dashboard",
    title: "CRM для отдела продаж",
    client: "Ритейл",
    d: ["web"],
    start: "2025-09", end: "2026-02",
    team: ["Продакт", "Фронтенд"],
    role: "Продуктовый дизайнер",
    url: "https://example.com",
    cover: { src: "", ratio: "16 / 10" },
    wide: true,
    intro: "Рабочее место менеджера: воронка, задачи и история клиента на одном экране.",
    blocks: [
      { type: "text", label: "01 Задача", text: "Описание задачи." },
      { type: "media", items: [{ src: "", ratio: "16 / 9", caption: "Воронка" }] },
      { type: "media", items: [
        { src: "", ratio: "4 / 3", caption: "Фильтры" },
        { src: "", ratio: "4 / 3", caption: "Карточка клиента" }
      ] },
      { type: "text", label: "02 Результат", text: "Итог." }
    ]
  },
  {
    slug: "festival-identity",
    title: "Айдентика фестиваля",
    client: "Фестиваль",
    d: ["graphic"],
    start: "2026-06", end: "2026-07",
    role: "Арт-директор",
    cover: { src: "", ratio: "3 / 4" },
    intro: "Логотип, шрифтовая система, афиши и навигация.",
    blocks: [
      { type: "media", items: [{ src: "", ratio: "3 / 2", caption: "Афиша" }] },
      { type: "text", label: "Идея", text: "Короткое описание идеи." },
      { type: "media", items: [{ src: "", ratio: "3 / 4" }, { src: "", ratio: "3 / 4" }] }
    ]
  },
  {
    slug: "poster-series",
    title: "Серия плакатов",
    client: "Личный проект",
    d: ["graphic"],
    start: "2026-04", end: "2026-04",
    cover: { src: "", ratio: "2 / 3" },
    blocks: [{ type: "media", items: [{ src: "", ratio: "2 / 3" }, { src: "", ratio: "2 / 3" }, { src: "", ratio: "2 / 3" }] }]
  },
  {
    slug: "delivery-app",
    title: "Приложение доставки",
    client: "Сервис доставки",
    d: ["mobile"],
    start: "2025-02", end: "2025-07",
    team: ["Продакт", "iOS", "Android"],
    role: "Продуктовый дизайнер",
    cover: { src: "", ratio: "4 / 5" },
    intro: "От каталога до трекинга курьера.",
    blocks: [
      { type: "text", label: "01 Контекст", text: "Контекст." },
      { type: "media", items: [{ src: "", ratio: "9 / 19.5" }, { src: "", ratio: "9 / 19.5" }, { src: "", ratio: "9 / 19.5" }, { src: "", ratio: "9 / 19.5" }] }
    ]
  },
  {
    slug: "studio-site",
    title: "Сайт архитектурного бюро",
    client: "Архитектурное бюро",
    d: ["web", "graphic"],
    start: "2025-10", end: "2025-12",
    team: ["Разработчик"],
    role: "Дизайн и арт-дирекшн",
    url: "https://example.com",
    cover: { src: "", ratio: "4 / 3" },
    blocks: [{ type: "media", items: [{ src: "", ratio: "16 / 9" }] }]
  },
  {
    slug: "book-cover",
    title: "Обложка книги",
    client: "Издательство",
    d: ["graphic"],
    start: "2025-05", end: "2025-05",
    cover: { src: "", ratio: "2 / 3" },
    blocks: [{ type: "media", items: [{ src: "", ratio: "2 / 3" }] }]
  },
  {
    slug: "zine",
    title: "Зин",
    client: "Личный проект",
    d: ["graphic"],
    start: "2024-11", end: "2024-12",
    cover: { src: "", ratio: "1 / 1" },
    wide: true,
    blocks: [{ type: "media", items: [{ src: "", ratio: "1 / 1" }, { src: "", ratio: "1 / 1" }] }]
  },
  {
    slug: "saas-onboarding",
    title: "Онбординг SaaS-сервиса",
    client: "B2B SaaS",
    d: ["web"],
    start: "2024-06", end: "2024-09",
    team: ["Продакт"],
    role: "Продуктовый дизайнер",
    cover: { src: "", ratio: "16 / 10" },
    blocks: [{ type: "text", label: "01 Задача", text: "Описание." }]
  },
  {
    slug: "packaging",
    title: "Упаковка кофе",
    client: "Обжарщик",
    d: ["graphic"],
    start: "2024-03", end: "2024-04",
    cover: { src: "", ratio: "4 / 5" },
    href: "https://example.com"   // без лонгрида — внешняя ссылка
  }
];
