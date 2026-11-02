/*
 * SpectrTech · API редактора сайта для Cloudflare Workers (статические файлы + KV).
 * Тот же контракт, что PHP-версия: /api/index.php?a=status|login|content|save|upload|history|restore|password
 * Привязки (wrangler.toml): ASSETS — файлы сайта, ST_KV — KV-хранилище.
 * Секрет ST_PASSWORD — начальный пароль (Settings → Variables and Secrets). После смены пароля в редакторе
 * в KV хранится только хеш (PBKDF2), и ST_PASSWORD больше не действует.
 * Ключи KV: content, auth, secret, hist_index, hist:<rev>, rate:<ip>, u:uploads/… (фото).
 */
const CFG = { tokenHours: 12, rememberDays: 30, maxUploadMB: 10, maxContentKB: 2048, historyKeep: 50, loginAttempts: 5, lockMinutes: 15, iterations: 100000 };
const enc = new TextEncoder();
const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'x-frame-options': 'DENY', 'referrer-policy': 'same-origin', 'x-robots-tag': 'noindex, nofollow' };
const out = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: JSON_HEADERS });
const fail = (error, status = 400, extra = {}) => out({ ok: false, error, ...extra }, status);
class Fail extends Error { constructor(code, status, extra) { super(code); this.code = code; this.status = status || 400; this.extra = extra || {}; } }

/* ── криптография ── */
function b64u(buf) { const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf); let s = ''; for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function ub64(s) { s = String(s).replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const bin = atob(s); const b = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i); return b; }
const rand = (n) => crypto.getRandomValues(new Uint8Array(n));
async function hmac(key, data) { const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); return b64u(await crypto.subtle.sign('HMAC', k, enc.encode(data))); }
async function sha256(s) { return b64u(await crypto.subtle.digest('SHA-256', enc.encode(s))); }
async function pbkdf2(pw, salt, it) { const k = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']); return b64u(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: it }, k, 256)); }
function same(a, b) { if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; }

async function secret(env) { let s = await env.ST_KV.get('secret'); if (!s) { s = b64u(rand(32)); await env.ST_KV.put('secret', s); } return s; }
async function authState(env) {
  const a = await env.ST_KV.get('auth', 'json');
  if (a && a.hash) return { mode: 'hash', hash: a.hash, stamp: a.hash };
  if (env.ST_PASSWORD) return { mode: 'initial', stamp: 'init:' + (await sha256(env.ST_PASSWORD)) };
  return { mode: 'none', stamp: '' };
}
async function checkPassword(env, pw, st) {
  pw = String(pw || '');
  if (st.mode === 'hash') { const [alg, it, salt, h] = String(st.hash).split('$'); return alg === 'pbkdf2' && same(await pbkdf2(pw, ub64(salt), +it || CFG.iterations), h); }
  if (st.mode === 'initial') return same(await sha256(pw), await sha256(env.ST_PASSWORD || ''));
  return false;
}
async function hashPassword(pw) { const salt = rand(16); return 'pbkdf2$' + CFG.iterations + '$' + b64u(salt) + '$' + (await pbkdf2(pw, salt, CFG.iterations)); }
async function makeToken(env, st, remember) {
  const exp = Math.floor(Date.now() / 1000) + (remember ? CFG.rememberDays * 86400 : CFG.tokenHours * 3600);
  const payload = b64u(enc.encode(JSON.stringify({ e: exp, n: b64u(rand(9)), r: remember ? 1 : 0 })));
  return { token: payload + '.' + (await hmac((await secret(env)) + '|' + st.stamp, payload)), exp };
}
async function authed(req, env) {
  const t = req.headers.get('x-st-token') || '';
  if (!t || t.length > 400 || t.split('.').length !== 2) return false;
  const [payload, sig] = t.split('.');
  const st = await authState(env);
  if (st.mode === 'none') return false;
  if (!same(await hmac((await secret(env)) + '|' + st.stamp, payload), sig)) return false;
  try { const p = JSON.parse(new TextDecoder().decode(ub64(payload))); return +p.e > Date.now() / 1000; } catch (e) { return false; }
}

/* ── контент ── */
function jsContent(c) { return 'window.ST_CONTENT=' + JSON.stringify(c).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029') + ';\n'; }
async function currentContent(env, req) {
  const s = await env.ST_KV.get('content');
  if (s) { try { return JSON.parse(s); } catch (e) {} }
  const r = await env.ASSETS.fetch(new Request(new URL('/content/site.js', req.url)));
  if (r.ok) { const m = /^\s*window\.ST_CONTENT\s*=\s*(\{[\s\S]*\})\s*;?\s*$/.exec(await r.text()); if (m) { try { return JSON.parse(m[1]); } catch (e) {} } }
  return { v: 1, rev: 0, pages: {}, img: {}, tel: {}, href: {} };
}
const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const BAD = new Set(['__proto__', 'constructor', 'prototype']);
function cleanVal(v, d = 0) {
  if (d > 10) return null;
  if (typeof v === 'string') return v.slice(0, 20000);
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'boolean' || v === null) return v;
  if (Array.isArray(v)) return v.map((x) => cleanVal(x, d + 1));
  if (isObj(v)) { const o = {}; for (const k of Object.keys(v)) { if (!k || k.length > 200 || BAD.has(k)) continue; o[k] = cleanVal(v[k], d + 1); } return o; }
  return null;
}
function validate(c, site) {
  if (!isObj(c)) throw new Fail('bad_content');
  const pages = {};
  for (const id of Object.keys(isObj(c.pages) ? c.pages : {})) {
    const p = c.pages[id];
    if (!/^[a-z0-9_-]{1,40}$/.test(id) || !isObj(p)) continue;
    const np = {};
    for (const lg of Object.keys(isObj(p.t) ? p.t : {})) {
      const t = p.t[lg];
      if (!/^[a-z]{2}$/.test(lg) || !isObj(t)) continue;
      for (const path of Object.keys(t)) {
        const v = t[path];
        if (!/^[\w.-]{1,160}$/.test(path) || !(typeof v === 'string' || Array.isArray(v))) continue;
        ((np.t = np.t || {})[lg] = np.t[lg] || {})[path] = cleanVal(v);
      }
    }
    for (const n of Object.keys(isObj(p.d) ? p.d : {})) {
      const v = p.d[n];
      if (!/^[A-Za-z_][A-Za-z0-9_]{0,40}$/.test(n) || !(Array.isArray(v) || isObj(v))) continue;
      (np.d = np.d || {})[n] = cleanVal(v);
    }
    if (Object.keys(np).length) pages[id] = np;
  }
  const img = {}, tel = {}, href = {};
  for (const [k, v] of Object.entries(isObj(c.img) ? c.img : {})) if (k && k.length <= 500 && typeof v === 'string' && (/^(?:[\w-]+\/)*[\w.-]+\.(?:jpe?g|png|webp|gif|avif|svg)$/i.test(v) || /^https:\/\/[^\s"'<>]{1,490}$/i.test(v))) img[k] = v;
  for (const [k, v] of Object.entries(isObj(c.tel) ? c.tel : {})) if (/^\d{7,15}$/.test(k) && typeof v === 'string' && v.length <= 40) tel[k] = v;
  for (const [k, v] of Object.entries(isObj(c.href) ? c.href : {})) if (k && k.length <= 1000 && typeof v === 'string' && /^(?:https?:\/\/|tel:|mailto:)[^\s"'<>]{1,990}$/i.test(v)) href[k] = v;
  return { v: 1, site, rev: 0, demo: false, updated: '', pages, img, tel, href };
}
async function publish(env, c) {
  c.updated = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  const s = JSON.stringify(c);
  if (s.length > CFG.maxContentKB * 1024) throw new Fail('too_large', 413);
  await env.ST_KV.put('content', s);
  await env.ST_KV.put('hist:' + c.rev, JSON.stringify({ time: Date.now(), content: c }));
  const idx = (await env.ST_KV.get('hist_index', 'json')) || [];
  idx.unshift({ rev: c.rev, time: Date.now() });
  const keep = idx.slice(0, CFG.historyKeep), drop = idx.slice(CFG.historyKeep);
  await env.ST_KV.put('hist_index', JSON.stringify(keep));
  for (const it of drop) await env.ST_KV.delete('hist:' + it.rev);
  return c;
}
async function bodyJSON(req, max) {
  const len = +(req.headers.get('content-length') || 0);
  if (len > max) throw new Fail('too_large', 413);
  const t = await req.text();
  if (t.length > max) throw new Fail('too_large', 413);
  try { const j = JSON.parse(t); if (isObj(j)) return j; } catch (e) {}
  throw new Fail('bad_json');
}

/* ── API ── */
async function api(req, env, url) {
  const a = url.searchParams.get('a') || 'status';
  const post = req.method === 'POST';
  const needPost = () => { if (!post) throw new Fail('method', 405); };
  const needAuth = async () => { if (!(await authed(req, env))) throw new Fail('auth', 401); };
  switch (a) {
    case 'status': {
      const st = await authState(env), c = await currentContent(env, req);
      return out({ ok: true, app: 'st-editor', backend: 'cloudflare', version: '1', configured: st.mode !== 'none', rev: +c.rev || 0, maxUpload: CFG.maxUploadMB * 1048576 });
    }
    case 'login': {
      needPost();
      const st = await authState(env);
      if (st.mode === 'none') return fail('not_configured', 503);
      const b = await bodyJSON(req, 4096);
      const ip = (req.headers.get('cf-connecting-ip') || '0').slice(0, 45), key = 'rate:' + ip, now = Math.floor(Date.now() / 1000);
      let e = (await env.ST_KV.get(key, 'json')) || { f: 0, t: now, l: 0 };
      if (e.l > now) return fail('too_many', 429, { retryAfter: e.l - now });
      if (await checkPassword(env, b.password, st)) {
        await env.ST_KV.delete(key);
        const t = await makeToken(env, st, !!b.remember);
        return out({ ok: true, token: t.token, exp: t.exp, mustChange: st.mode === 'initial' });
      }
      if (e.t < now - CFG.lockMinutes * 60) e = { f: 0, t: now, l: 0 };
      e.f++;
      if (e.f >= CFG.loginAttempts) e = { f: 0, t: now, l: now + CFG.lockMinutes * 60 };
      await env.ST_KV.put(key, JSON.stringify(e), { expirationTtl: 86400 });
      await new Promise((r) => setTimeout(r, 400));
      return e.l > now ? fail('too_many', 429, { retryAfter: e.l - now }) : fail('bad_password', 401);
    }
    case 'content': { await needAuth(); return out({ ok: true, content: await currentContent(env, req) }); }
    case 'save': {
      needPost(); await needAuth();
      const b = await bodyJSON(req, CFG.maxContentKB * 1024 + 4096);
      const cur = await currentContent(env, req), rev = +cur.rev || 0;
      if (+b.rev !== rev) return fail('conflict', 409, { rev });
      const c = validate(b.content, String(cur.site || 'site'));
      c.rev = rev + 1;
      await publish(env, c);
      return out({ ok: true, rev: c.rev, updated: c.updated });
    }
    case 'upload': {
      needPost(); await needAuth();
      const max = CFG.maxUploadMB * 1048576;
      if (+(req.headers.get('content-length') || 0) > max + 65536) return fail('too_large', 413);
      let f;
      try { f = (await req.formData()).get('file'); } catch (e) { return fail('no_file'); }
      if (!f || typeof f === 'string') return fail('no_file');
      if (f.size > max || f.size <= 0) return fail('too_large', 413);
      const buf = new Uint8Array(await f.arrayBuffer());
      const ascii = (i, n) => String.fromCharCode(...buf.slice(i, i + n));
      let ext = '', type = '';
      if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) { ext = 'jpg'; type = 'image/jpeg'; }
      else if (buf[0] === 0x89 && ascii(1, 3) === 'PNG') { ext = 'png'; type = 'image/png'; }
      else if (ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') { ext = 'webp'; type = 'image/webp'; }
      else if (ascii(0, 6) === 'GIF87a' || ascii(0, 6) === 'GIF89a') { ext = 'gif'; type = 'image/gif'; }
      if (!ext) return fail('bad_type', 415);
      const d = new Date(), hex = [...rand(8)].map((x) => x.toString(16).padStart(2, '0')).join('');
      const rel = 'uploads/' + d.getUTCFullYear() + '/' + String(d.getUTCMonth() + 1).padStart(2, '0') + '/' + hex + '.' + ext;
      await env.ST_KV.put('u:' + rel, buf, { metadata: { type } });
      return out({ ok: true, url: rel, size: buf.length });
    }
    case 'history': {
      await needAuth();
      const idx = (await env.ST_KV.get('hist_index', 'json')) || [];
      return out({ ok: true, items: idx.map((x) => ({ rev: x.rev, time: x.time })) });
    }
    case 'restore': {
      needPost(); await needAuth();
      const b = await bodyJSON(req, 1024);
      const h = await env.ST_KV.get('hist:' + (+b.rev || 0), 'json');
      if (!h || !isObj(h.content)) return fail('not_found', 404);
      const cur = await currentContent(env, req);
      const c = validate(h.content, String(cur.site || 'site'));
      c.rev = (+cur.rev || 0) + 1;
      await publish(env, c);
      return out({ ok: true, rev: c.rev, updated: c.updated, content: c });
    }
    case 'password': {
      needPost(); await needAuth();
      const b = await bodyJSON(req, 4096);
      const st = await authState(env);
      if (!(await checkPassword(env, b.old, st))) { await new Promise((r) => setTimeout(r, 400)); return fail('bad_password', 403); }
      const nw = String(b.new || '');
      if ([...nw].length < 8 || nw.length > 200) return fail('weak');
      await env.ST_KV.put('auth', JSON.stringify({ hash: await hashPassword(nw), changed: Date.now() }));
      const t = await makeToken(env, await authState(env), false);
      return out({ ok: true, token: t.token, exp: t.exp });
    }
  }
  return fail('unknown', 404);
}

async function serveContent(req, env) {
  const s = await env.ST_KV.get('content');
  if (!s) return env.ASSETS.fetch(req);
  let c; try { c = JSON.parse(s); } catch (e) { return env.ASSETS.fetch(req); }
  const etag = '"r' + (+c.rev || 0) + '"';
  const h = { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-cache', etag, 'x-content-type-options': 'nosniff' };
  if (req.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers: h });
  return new Response(jsContent(c), { headers: h });
}
async function serveUpload(req, env, url, ctx) {
  const cache = caches.default;
  const hit = await cache.match(req);
  if (hit) return hit;
  let path; try { path = decodeURIComponent(url.pathname.slice(1)); } catch (e) { return new Response('Not found', { status: 404 }); }
  if (!/^uploads\/\d{4}\/\d{2}\/[0-9a-f]{16}\.(jpg|png|webp|gif)$/.test(path)) return env.ASSETS.fetch(req);
  const { value, metadata } = await env.ST_KV.getWithMetadata('u:' + path, 'arrayBuffer');
  if (!value) return new Response('Not found', { status: 404 });
  const res = new Response(value, { headers: { 'content-type': (metadata && metadata.type) || 'application/octet-stream', 'cache-control': 'public, max-age=31536000, immutable', 'x-content-type-options': 'nosniff' } });
  ctx.waitUntil(cache.put(req, res.clone()));
  return res;
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    try {
      if (url.pathname === '/') return env.ASSETS.fetch(new Request(new URL('/index.html', url), req));
      if (url.pathname === '/api/index.php' || url.pathname === '/api/' || url.pathname === '/api') return await api(req, env, url);
      if (url.pathname === '/content/site.js' && (req.method === 'GET' || req.method === 'HEAD')) return await serveContent(req, env);
      if (url.pathname.startsWith('/uploads/') && (req.method === 'GET' || req.method === 'HEAD')) return await serveUpload(req, env, url, ctx);
    } catch (e) {
      if (e instanceof Fail) return fail(e.code, e.status, e.extra);
      console.error('st-editor', e && e.stack || e);
      return fail('server', 500);
    }
    return env.ASSETS.fetch(req);
  }
};
