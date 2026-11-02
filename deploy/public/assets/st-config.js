/* IM Motors · st-config.js — страницы сайта для редактора SpectrTech (генерирует build-cf.pl).
   Тексты (AZ/RU/EN) правятся кликом по тексту или во вкладке «Mətnlər»; фото — кликом по фото;
   телефоны и ссылки — во вкладке контактов. Шапку, CTA и подвал правьте на главной — они общие для всех страниц. */
window.ST_EDITOR = {
  site: 'immotors-az',
  brand: 'IM Motors Azərbaycan',
  langs: ['az', 'ru', 'en'],
  pages: [
    { id: 'index', file: '/', name: { az: 'Ana səhifə (başlıq, CTA və alt hissə — bütün səhifələr üçün)', ru: 'Главная (шапка, CTA и подвал — для всех страниц)', en: 'Home (header, CTA and footer — all pages)' } },
    { id: 'l7', file: '/l7', name: { az: 'IM L7', ru: 'IM L7', en: 'IM L7' } },
    { id: 'ls7', file: '/ls7', name: { az: 'IM LS7', ru: 'IM LS7', en: 'IM LS7' } },
    { id: 'l6', file: '/l6', name: { az: 'IM L6', ru: 'IM L6', en: 'IM L6' } },
    { id: 'ls6', file: '/ls6', name: { az: 'IM LS6', ru: 'IM LS6', en: 'IM LS6' } },
    { id: 'ls9', file: '/ls9', name: { az: 'IM LS9', ru: 'IM LS9', en: 'IM LS9' } },
    { id: 'ls8', file: '/ls8', name: { az: 'IM LS8', ru: 'IM LS8', en: 'IM LS8' } },
    { id: 'testdrive', file: '/testdrive', name: { az: 'Test sürüşü', ru: 'Тест-драйв', en: 'Test drive' } },
    { id: 'office', file: '/office', name: { az: 'Salon və əlaqə', ru: 'Салон и контакты', en: 'Showroom & contact' } },
    { id: 'privacy', file: '/privacy', name: { az: 'Məxfilik siyasəti', ru: 'Политика конфиденциальности', en: 'Privacy policy' } },
    { id: 'terms', file: '/terms', name: { az: 'İstifadə şərtləri', ru: 'Условия использования', en: 'Terms of use' } },
    { id: '404', file: '/404', name: { az: 'Səhifə tapılmadı (404)', ru: 'Страница не найдена (404)', en: 'Page not found (404)' } }
  ]
};
