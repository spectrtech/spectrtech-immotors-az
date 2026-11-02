/* IM Motors · imx-cms.js — связывает тексты сайта с редактором SpectrTech (assets/st-content.js, mainedit.html).
   Тексты на страницах лежат тройками <span data-l="az|ru|en">. Сборка (build-cf.pl) даёт каждой тройке ключ
   data-i18n-html="t<8 знаков md5 трёх текстов>" — на родителе, если тройка его единственное содержимое, иначе на обёртке <span>.
   Здесь из троек собирается словарь I, STC.use применяет сохранённые правки (сначала правки главной — так шапка,
   CTA и подвал меняются на всех страницах, — затем правки этой страницы), и изменённые тексты пишутся обратно в span[data-l].
   Подключение — в конце <body>: <script src="/assets/imx-cms.js" data-page="l7"></script> (до DOMContentLoaded). */
(function () {
  'use strict';
  var W = window, D = document, LANGS = ['az', 'ru', 'en'];
  var STC = W.STC;
  if (!STC) return;
  var me = D.currentScript;
  var page = (me && me.getAttribute('data-page')) || 'index';
  var C = W.ST_CONTENT || {}, P = C.pages || {};
  function own(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

  /* <picture>: когда st-content заменил фото в <img>, тот же файл ставим и в <source> (иначе на широком экране старое фото) */
  function syncPic(img) {
    var p = img.parentNode;
    if (!p || p.nodeName !== 'PICTURE' || !img.hasAttribute('data-st-orig')) return;
    var src = img.getAttribute('src'), ss = p.getElementsByTagName('source');
    for (var i = 0; i < ss.length; i++) if (ss[i].getAttribute('srcset') !== src) ss[i].setAttribute('srcset', src);
  }
  function syncAll() { var l = D.querySelectorAll('picture > img[data-st-orig]'); for (var i = 0; i < l.length; i++) syncPic(l[i]); }
  if ((C.img && Object.keys(C.img).length) || STC.edit) {
    D.addEventListener('DOMContentLoaded', syncAll);
    if ('MutationObserver' in W) new MutationObserver(function (recs) {
      for (var i = 0; i < recs.length; i++) if (recs[i].target.nodeName === 'IMG') syncPic(recs[i].target);
    }).observe(D.documentElement, { subtree: true, attributes: true, attributeFilter: ['src', 'data-st-orig'] });
  }

  /* правок текста нет и это не редактор — словарь не нужен */
  if (!STC.edit && !(own(P, 'index') && P.index.t) && !(own(P, page) && P[page].t)) return;

  var els = D.querySelectorAll('[data-i18n-html]');
  var I = { az: {}, ru: {}, en: {} }, base = { az: {}, ru: {}, en: {} };
  function span(el, lg) { for (var c = el.firstElementChild; c; c = c.nextElementSibling) if (c.getAttribute('data-l') === lg) return c; return null; }
  for (var i = 0; i < els.length; i++) {
    var k = els[i].getAttribute('data-i18n-html');
    if (own(I.az, k)) continue;
    for (var j = 0; j < LANGS.length; j++) { var s = span(els[i], LANGS[j]); if (s) I[LANGS[j]][k] = base[LANGS[j]][k] = s.innerHTML; }
  }
  /* all=false — только тексты, изменённые правками; all=true — сверить всё (редактор после каждой правки) */
  function apply(all) {
    for (var i = 0; i < els.length; i++) {
      var k = els[i].getAttribute('data-i18n-html');
      for (var j = 0; j < LANGS.length; j++) {
        var lg = LANGS[j], v = I[lg][k];
        if (typeof v !== 'string' || (!all && v === base[lg][k])) continue;
        var s = span(els[i], lg);
        if (s && s.innerHTML !== v) s.innerHTML = v;
      }
    }
  }
  if (page !== 'index') STC.use('index', { I: I });
  STC.use(page, { I: I, refresh: function () { apply(true); } });
  apply(false);
})();
