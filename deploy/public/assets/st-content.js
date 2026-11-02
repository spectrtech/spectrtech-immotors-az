/* SpectrTech · st-content.js — применяет сохранённые правки к странице.
   Публичный сайт: правки из content/site.js (window.ST_CONTENT).
   Демо (ST_CONTENT.demo): правки, сохранённые редактором mainedit.html в этом браузере.
   Предпросмотр внутри mainedit.html (?st_edit=1): несохранённый черновик редактора.
   Модель: pages[id].t[lang][path] — тексты словаря I; pages[id].d[NAME] — списки данных;
   img{исходный путь: новый}, tel{старые цифры: новый номер}, href{старая ссылка: новая}. */
(function () {
  'use strict';
  var W = window, D = document;
  var C = W.ST_CONTENT || {};
  var SITE = String(C.site || 'site');
  var EDIT = false, ED = null;
  function bad(k) { return k === '__proto__' || k === 'constructor' || k === 'prototype'; }
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k) && !bad(k); }
  function clone(v) {
    if (Array.isArray(v)) return v.map(clone);
    if (v && typeof v === 'object') { var o = {}; for (var k in v) if (has(v, k)) o[k] = clone(v[k]); return o; }
    return v;
  }

  try { EDIT = /(?:^|&)st_edit=1(?:&|$)/.test(location.search.slice(1)) && W.parent !== W && !!W.parent.STE; } catch (e) { EDIT = false; }
  if (EDIT) {
    ED = W.parent.STE;
    try { var dr = ED.draft(); if (dr) C = dr; } catch (e) {}
  } else if (C.demo) {
    try { var raw = localStorage.getItem('stx_demo:' + SITE); if (raw) { var L = JSON.parse(raw); if (L && L.v === 1) { L.demo = true; C = L; } } } catch (e) {}
  }
  C = clone(C);
  var PAGES = C.pages || {}, IMG = C.img || {}, TEL = C.tel || {}, HREF = C.href || {};

  /* ── очистка значений (защита от вставки разметки и скриптов) ── */
  function txt(s) { return String(s).replace(/</g, '‹').replace(/>/g, '›').replace(/"/g, '”'); }
  function safeUrl(u) {
    u = String(u == null ? '' : u).trim();
    if (/^(?:https?:\/\/|tel:|mailto:)[^\s"'<>]*$/i.test(u)) return u;
    if (/^(?:#|\.?\/)?[\w.\/~%-]+(?:[?#][^\s"'<>]*)?$/.test(u) && u.indexOf(':') < 0) return u;
    if (/^#[\w-]*$/.test(u)) return u;
    return '';
  }
  function safeImg(u) {
    u = String(u == null ? '' : u).trim();
    if (/^https:\/\/[^\s"'<>]+$/i.test(u)) return u;
    if (/^(?:\.\/)?[\w-]+(?:\/[\w.-]+)*\.(?:jpe?g|png|webp|gif|avif|svg)$/i.test(u)) return u;
    if (/^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+\/=]+$/.test(u)) return u;
    return '';
  }
  var TAG = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^<>]*)>/g;
  var INLINE = { i: 1, em: 1, b: 1, strong: 1, br: 1, small: 1, span: 1, u: 1, s: 1, sup: 1, sub: 1, mark: 1, a: 1, wbr: 1 };
  function rich(s) {
    s = String(s); var out = '', last = 0, m;
    TAG.lastIndex = 0;
    while ((m = TAG.exec(s))) {
      out += txt(s.slice(last, m.index)); last = TAG.lastIndex;
      var name = m[2].toLowerCase();
      if (!INLINE[name]) continue;
      if (m[1]) { if (name !== 'br' && name !== 'wbr') out += '</' + name + '>'; continue; }
      var at = '';
      if (name === 'a') {
        var h = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i.exec(m[3]);
        var u = h ? safeUrl(h[1] != null ? h[1] : h[2] != null ? h[2] : h[3]) : '';
        if (u) at += ' href="' + u + '"';
        if (/\btarget\s*=\s*["']?_blank/i.test(m[3])) at += ' target="_blank" rel="noopener"';
        else if (/^https?:/i.test(u)) at += ' rel="noopener"';
      }
      out += '<' + name + at + '>';
    }
    return out + txt(s.slice(last));
  }
  function deep(v, f) {
    if (typeof v === 'string') return f(v);
    if (Array.isArray(v)) return v.map(function (x) { return deep(x, f); });
    if (v && typeof v === 'object') { var o = {}; for (var k in v) if (has(v, k)) o[k] = deep(v[k], f); return o; }
    return typeof v === 'number' || typeof v === 'boolean' || v === null ? v : undefined;
  }

  /* ── тексты и данные страницы ── */
  function setPath(o, path, v) {
    var ks = String(path).split('.'), i, k;
    for (i = 0; i < ks.length - 1; i++) {
      k = ks[i]; if (bad(k)) return;
      if (o[k] == null) o[k] = /^\d+$/.test(ks[i + 1]) ? [] : {};
      if (typeof o[k] !== 'object') return;
      o = o[k];
    }
    k = ks[i]; if (bad(k)) return;
    var cur = o[k];
    if (typeof cur === 'function') return;
    if (cur && typeof cur === 'object' && !Array.isArray(cur)) return;
    o[k] = v;
  }
  function fill(target, val) {
    if (Array.isArray(target) && Array.isArray(val)) { target.length = 0; for (var i = 0; i < val.length; i++) target.push(val[i]); return; }
    if (target && typeof target === 'object' && !Array.isArray(target) && val && typeof val === 'object' && !Array.isArray(val)) {
      for (var k in target) if (has(target, k)) delete target[k];
      for (k in val) if (has(val, k)) target[k] = val[k];
    }
  }

  var STC = W.STC = {
    edit: EDIT,
    demo: !!C.demo,
    site: SITE,
    /* STC.use('via', {I: I, data: {MENU: MENU}, refresh: fn, wa: '994…'}) — вызывается страницей до первой отрисовки */
    use: function (id, o) {
      o = o || {};
      var P = PAGES[id] || {}, I = o.I || {}, data = o.data || {};
      var def = EDIT ? { I: clone(I), data: clone(data) } : null;
      var t = P.t || {}, d = P.d || {}, lg, path, n;
      for (lg in t) if (has(t, lg) && I[lg] && t[lg] && typeof t[lg] === 'object') {
        for (path in t[lg]) if (has(t[lg], path)) {
          var v = deep(t[lg][path], rich);
          if (typeof v === 'string' || Array.isArray(v)) setPath(I[lg], path, v);
        }
      }
      for (n in d) if (has(d, n) && data[n] && typeof data[n] === 'object') fill(data[n], deep(d[n], txt));
      if (EDIT) W.ST_PAGE = { id: id, I: I, data: data, def: def, refresh: o.refresh, wa: o.wa || [] };
    },
    /* путь к фото с учётом замен из редактора */
    img: function (p) {
      p = String(p == null ? '' : p);
      if (has(IMG, p)) { var n = safeImg(IMG[p]); if (n) return n; }
      return p;
    },
    url: mapUrl,
    clean: rich
  };

  /* ── телефоны и ссылки по всему сайту ── */
  function norm(dg) { dg = String(dg).replace(/\D/g, ''); if (dg.indexOf('00') === 0) dg = dg.slice(2); if (/^0\d{9}$/.test(dg)) dg = '994' + dg.slice(1); return dg; }
  var SEP = '[\\s\\-().\\u00a0]*';
  var TELS = [];
  for (var tk in TEL) if (has(TEL, tk)) {
    var from = norm(tk), to = txt(String(TEL[tk]).trim()), toD = norm(to);
    if (from.length < 7 || toD.length < 7 || from === toD) continue;
    var nat = from.indexOf('994') === 0 ? from.slice(3) : from;
    TELS.push({ from: from, to: to, toD: toD, re: new RegExp('(?:\\+?' + SEP + '9' + SEP + '9' + SEP + '4' + SEP + '|0' + SEP + ')?' + nat.split('').join(SEP) + '(?!\\d)', 'g') });
  }
  var HREFS = 0; for (var hk in HREF) if (has(HREF, hk)) HREFS++;
  var IMGS = 0; for (var ik in IMG) if (has(IMG, ik)) IMGS++;

  function mapUrl(u) {
    u = String(u == null ? '' : u);
    if (has(HREF, u)) { var nu = safeUrl(HREF[u]); if (nu) u = nu; }
    for (var i = 0; i < TELS.length; i++) {
      var r = TELS[i];
      if (/^tel:/i.test(u)) { if (norm(u) === r.from) return 'tel:+' + r.toD; continue; }
      u = u.replace(new RegExp('(wa\\.me\\/|phone=)(?:\\+|%2B)?' + r.from + '(?!\\d)', 'i'), '$1' + r.toD);
    }
    return u;
  }
  function mapText(node) {
    var s = node.data, out = s;
    for (var i = 0; i < TELS.length; i++) {
      var r = TELS[i];
      r.re.lastIndex = 0;
      out = out.replace(r.re, function (m, off, all) { return off > 0 && /\d/.test(all.charAt(off - 1)) ? m : r.to; });
    }
    if (out !== s) node.data = out;
  }
  function mapImg(el) {
    var s = el.getAttribute('src'); if (!s) return;
    var o = el.getAttribute('data-st-orig');
    if (o != null && has(IMG, o) && safeImg(IMG[o]) === s) return;
    if (has(IMG, s)) { var n = safeImg(IMG[s]); if (n && n !== s) { el.setAttribute('data-st-orig', s); el.setAttribute('src', n); } }
  }
  function mapA(el) {
    var h = el.getAttribute('href'); if (!h) return;
    var o = el.getAttribute('data-st-href');
    if (o != null && mapUrl(o) === h) return;
    var n = mapUrl(h);
    if (n !== h) { el.setAttribute('data-st-href', h); el.setAttribute('href', n); }
  }
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, NOSCRIPT: 1, TEMPLATE: 1 };
  function scan(root) {
    if (!root || root.nodeType === 8) return;
    if (root.nodeType === 3) { if (TELS.length && root.parentNode && !SKIP[root.parentNode.nodeName]) mapText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9) return;
    if (root.nodeType === 1) {
      if (SKIP[root.nodeName]) return;
      if (IMGS && root.nodeName === 'IMG') mapImg(root);
      if ((HREFS || TELS.length) && root.nodeName === 'A') mapA(root);
    }
    var i, list;
    if (IMGS) { list = root.getElementsByTagName('img'); for (i = 0; i < list.length; i++) mapImg(list[i]); }
    if (HREFS || TELS.length) { list = root.getElementsByTagName('a'); for (i = 0; i < list.length; i++) mapA(list[i]); }
    if (TELS.length) {
      var tw = D.createTreeWalker(root, 4, null, false), nd;
      while ((nd = tw.nextNode())) if (nd.parentNode && !SKIP[nd.parentNode.nodeName]) mapText(nd);
    }
  }
  if (IMGS || HREFS || TELS.length) {
    if (TELS.length || HREFS) {
      var wo = W.open;
      W.open = function (u) { var a = [].slice.call(arguments); if (typeof u === 'string') a[0] = mapUrl(u); return wo.apply(W, a); };
    }
    if ('MutationObserver' in W) {
      new MutationObserver(function (recs) {
        for (var i = 0; i < recs.length; i++) {
          var r = recs[i];
          if (r.type === 'attributes') { if (r.target.nodeName === 'IMG') mapImg(r.target); else if (r.target.nodeName === 'A') mapA(r.target); }
          else for (var j = 0; j < r.addedNodes.length; j++) scan(r.addedNodes[j]);
        }
      }).observe(D.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'href'] });
    }
    D.addEventListener('DOMContentLoaded', function () { scan(D.body); });
  }
  if (C.demo) D.documentElement.classList.add('st-demo');

  /* ── предпросмотр в редакторе: сообщаем, что страница готова ── */
  if (EDIT) {
    D.documentElement.classList.add('st-edit');
    var ready = function () { try { ED.ready(W); } catch (e) {} };
    if (D.readyState === 'complete' || D.readyState === 'interactive') setTimeout(ready, 0);
    else D.addEventListener('DOMContentLoaded', ready);
  }
})();
