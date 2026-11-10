/* IM Motors · imx-cms.js — связывает тексты и цифры сайта с редактором SpectrTech (assets/st-content.js, mainedit.html).
   Тексты на страницах лежат тройками <span data-l="az|ru|en">. Сборка (build-cf.pl) даёт каждой тройке ключ
   data-i18n-html="t<8 знаков md5 трёх текстов>" — на родителе, если тройка его единственное содержимое, иначе на обёртке <span>.
   Здесь из троек собирается словарь I, STC.use применяет сохранённые правки (сначала правки главной — так шапка,
   CTA и подвал меняются на всех страницах, — затем правки этой страницы), и изменённые тексты пишутся обратно в span[data-l].
   Цифры (шапка модели, цифры обзора, таблица, цифры на главной) — список данных SPECS_<хеш состава>: сборка ставит им
   data-st="SPECS_<хеш>.<n>" data-sk="<id>", значение одно на все языки; правки применяются по id, а не по номеру,
   и после смены состава цифр переносятся из прежнего списка по id.
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

  /* правок текста и цифр нет и это не редактор — ничего не нужно */
  var mine = own(P, page) && P[page] ? P[page] : {};
  if (!STC.edit && !(own(P, 'index') && P.index.t) && !mine.t && !mine.d) return;

  /* ── тексты ── */
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

  /* ── цифры ──
     строка цифр обзора: <b>787<small>hp</small></b> ↔ «787 hp» (единица — после последнего пробела);
     шапка модели и главная: текст перед <small> с подписью; таблица: вся ячейка. */
  var sEls = [], SPECS = [], DS = '';
  (function () {
    var l = D.querySelectorAll('[data-st^="SPECS_"]');
    for (var i = 0; i < l.length; i++) {
      var a = l[i].getAttribute('data-st'), p = a.lastIndexOf('.'), n = parseInt(a.slice(p + 1), 10);
      if (!DS) DS = a.slice(0, p);
      if (n >= 0) sEls[n] = l[i];
    }
  })();
  function unitEl(el) { var c = el.lastElementChild; return c && c.nodeName === 'SMALL' && !c.hasAttribute('data-i18n-html') ? c : null; }
  function lead(el) { var t = el.firstChild; return t && t.nodeType === 3 ? t : null; }
  function sGet(el) {
    var u = unitEl(el), t = lead(el);
    if (u) return ((t ? t.data : '') + ' ' + u.textContent).trim();
    if (el.firstElementChild) return t ? t.data.trim() : '';
    return el.textContent.trim();
  }
  function sSet(el, v) {
    var u = unitEl(el), t = lead(el), x = v;
    if (u) { var m = /^(.*\S)\s+(\S+)$/.exec(v); x = m ? m[1] : v; u.textContent = m ? m[2] : ''; }
    if (u || el.firstElementChild) { if (t) t.data = x; else el.insertBefore(D.createTextNode(x), el.firstChild); }
    else el.textContent = x;
  }
  /* значения из прежних списков SPECS_* этой страницы (состав цифр поменялся при сборке) — переносим по id */
  var old = {}, src = mine;
  if (STC.edit) { try { var dr = W.parent.STE.draft(); if (dr && dr.pages && own(dr.pages, page)) src = dr.pages[page]; } catch (e) {} }
  var Dd = (src && src.d) || {};
  for (var nm in Dd) if (own(Dd, nm) && /^SPECS/.test(nm) && nm !== DS && Array.isArray(Dd[nm])) {
    for (var q = 0; q < Dd[nm].length; q++) { var o = Dd[nm][q]; if (o && typeof o.id === 'string' && typeof o.v === 'string') old[o.id] = o.v; }
  }
  for (var n = 0; n < sEls.length; n++) {
    var sid = sEls[n] ? sEls[n].getAttribute('data-sk') : '';
    SPECS.push({ id: sid, v: own(old, sid) ? old[sid] : sEls[n] ? sGet(sEls[n]) : '' });
  }
  function applyS() {
    var m = {};
    for (var i = 0; i < SPECS.length; i++) { var it = SPECS[i]; if (it && typeof it.id === 'string' && it.id && typeof it.v === 'string') m[it.id] = it.v; }
    for (var j = 0; j < sEls.length; j++) {
      var el = sEls[j]; if (!el) continue;
      var id = el.getAttribute('data-sk');
      if (own(m, id) && m[id] !== sGet(el)) sSet(el, m[id]);
    }
  }

  if (page !== 'index') STC.use('index', { I: I });
  var data = {}; if (DS) data[DS] = SPECS;
  STC.use(page, { I: I, data: data, refresh: function () { apply(true); applyS(); } });
  apply(false);
  applyS();
})();
