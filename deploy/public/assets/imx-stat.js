/* IM Motors · imx-stat.js — счётчики статистики: Google Analytics 4 и Яндекс Метрика (те же, что стояли на старом сайте на Tilda).
   Считают только https://immotors.az. На тестовом адресе workers.dev, локально и в редакторе (страница во фрейме /mainedit) не работают.
   Скрипты счётчиков грузятся после загрузки страницы, чтобы не замедлять её показ.
   Подключение — в конце <body> (ставит build-cf.pl). */
(function () {
  'use strict';
  var W = window, D = document;
  if (location.hostname !== 'immotors.az' || W.self !== W.top) return;
  var GA = 'G-HLB14Z15HG', YM = 100653801;

  /* Google Analytics 4 */
  W.dataLayer = W.dataLayer || [];
  W.gtag = W.gtag || function () { W.dataLayer.push(arguments); };
  W.gtag('js', new Date());
  W.gtag('config', GA);

  /* Яндекс Метрика — настройки как на Tilda: карта кликов, переходы по внешним ссылкам (WhatsApp, turbo.az), точный показатель отказов, Вебвизор */
  W.ym = W.ym || function () { (W.ym.a = W.ym.a || []).push(arguments); };
  W.ym.l = +new Date();
  W.ym(YM, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });

  function add(src) { var s = D.createElement('script'); s.async = true; s.src = src; D.head.appendChild(s); }
  function load() {
    add('https://www.googletagmanager.com/gtag/js?id=' + GA);
    add('https://mc.yandex.ru/metrika/tag.js');
  }
  if (D.readyState === 'complete') load(); else W.addEventListener('load', load);
})();
