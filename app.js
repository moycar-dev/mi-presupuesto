(function () {
  'use strict';
  var L = window.Logic;
  var KEY = 'mp_state_v1';
  var ICON = {
    hoy: '<svg viewBox="0 0 24 24"><path d="M3 11.5 12 3l9 8.5V20a1.5 1.5 0 0 1-1.5 1.5H15v-6.5H9v6.5H4.5A1.5 1.5 0 0 1 3 20z" fill="currentColor"/></svg>',
    camino: '<svg viewBox="0 0 24 24"><circle cx="6" cy="18" r="3" fill="currentColor"/><circle cx="18" cy="6" r="3" fill="currentColor"/><path d="M6 15c0-6 12 0 12-6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="0.5 4.5"/></svg>',
    plan: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3.5" fill="currentColor"/><rect x="7" y="2" width="3" height="6" rx="1.5" fill="currentColor"/><rect x="14" y="2" width="3" height="6" rx="1.5" fill="currentColor"/><path d="M3 11h18" stroke="#fff" stroke-width="2"/></svg>',
    metas: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="12" cy="12" r="4.5" fill="currentColor"/></svg>',
    gastos: '<svg viewBox="0 0 24 24"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M9 8h6M9 12h6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    ajustes: '<svg viewBox="0 0 24 24"><path d="M4 7h10M18 7h2M4 17h2M10 17h10M4 12h16" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><circle cx="16" cy="7" r="2.6" fill="currentColor"/><circle cx="8" cy="17" r="2.6" fill="currentColor"/></svg>'
  };
  var TABS = [['hoy', 'Hoy'], ['gastos', 'Gastos'], ['camino', 'Camino'], ['plan', 'Plan'], ['metas', 'Metas'], ['ajustes', 'Ajustes']];
  var LEVELS = ['Semilla', 'Centavo', 'Alcancía', 'Peso firme', 'Ahorrador', 'Ahorrador pro', 'Maestro del colchón', 'Inversor en marcha', 'Constructor de futuro', 'Leyenda'];
  var tab = 'hoy';
  var TIPOS = [
    { c: '#ffb15a', k: 'comida', e: '🍔', n: 'Comida fuera', env: 'salidas' }, { c: '#ff3d8b', k: 'salidas', e: '🎉', n: 'Salidas', env: 'salidas' },
    { c: '#27e3d0', k: 'transporte', e: '🚗', n: 'Transporte', env: 'otro' }, { c: '#7cf29a', k: 'super', e: '🛒', n: 'Súper', env: 'otro' },
    { c: '#b78bff', k: 'eventos', e: '🎟️', n: 'Eventos', env: 'eventos' }, { c: '#6ab7ff', k: 'trabajo', e: '💼', n: 'Trabajo', env: 'trabajo' },
    { c: '#ffc247', k: 'gustos', e: '🎮', n: 'Gustos', env: 'gustos' }, { c: '#ff6b6b', k: 'salud', e: '💊', n: 'Salud', env: 'otro' }, { c: '#a99bd6', k: 'otro', e: '📦', n: 'Otro', env: 'otro' }
  ];
  var METODOS = [{ k: 'efectivo', n: 'Efectivo', cash: 1 }, { k: 'debito', n: 'Débito', cash: 1 }, { k: 'nu', n: 'Crédito Nu', cash: 0 }, { k: 'discover', n: 'Discover', cash: 0 }];
  var ITIPOS = [{ k: 'sueldo', n: 'Sueldo' }, { k: 'extra', n: 'Extra' }, { k: 'apoyo', n: 'Apoyo' }, { k: 'venta', n: 'Venta' }, { k: 'otro', n: 'Otro' }];
  var DESTINOS = [{ k: 'efectivo', n: 'Efectivo', cash: 1 }, { k: 'nu', n: 'Nu', cash: 1 }, { k: 'bbva', n: 'BBVA', cash: 1 }, { k: 'inversion', n: 'Inversión', cash: 0 }];
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var EMO = { efectivo: '💵', debito: '🏧', nu: '💜', discover: '🧡', bbva: '🔷', inversion: '📈', nu2: '💜', sueldo: '💼', extra: '⚡', apoyo: '🤝', venta: '🏷️' };
  function tiles(list, cur, act, emoOf) {
    return '<div class="tiles' + (list.length === 4 ? ' t2' : '') + '">' + list.map(function (t) { return '<button class="tile' + (cur === t.k ? ' on' : '') + '" data-a="' + act + '" data-v="' + t.k + '"><span class="em">' + (emoOf ? emoOf(t) : t.e) + '</span>' + t.n + '</button>'; }).join('') + '</div>';
  }
  function pick(list, k) { for (var i = 0; i < list.length; i++) if (list[i].k === k) return list[i]; return null; }
  function tipoOf(e) {
    var t = pick(TIPOS, e.tipo);
    if (t) return t;
    var envName = L.ENV_NAMES[e.env] ? L.ENV_NAMES[e.env].split(' ')[0] : 'Otro';
    return { k: 'env-' + e.env, e: '📦', n: envName, env: e.env };
  }
  var ui = { tipo: 'comida', met: 'efectivo', date: '', itipo: 'sueldo', idest: 'efectivo', iamt: '', inote: '', idate: '', gm: 0, more: false, gf: 'todo', msg: '', amt: '', note: '', prevFill: 0, toast: null, levelup: 0 };

  // ---------- estado ----------
  function merge(base, saved) {
    Object.keys(saved || {}).forEach(function (k) {
      var b = base[k], v = saved[k];
      if (b && typeof b === 'object' && !Array.isArray(b) && v && typeof v === 'object' && !Array.isArray(v)) {
        Object.keys(v).forEach(function (j) { b[j] = v[j]; });
      } else base[k] = v;
    });
    return base;
  }
  function load() {
    try { var r = localStorage.getItem(KEY); if (r) return merge(L.defaults(), JSON.parse(r)); } catch (e) {}
    return L.defaults();
  }
  var S = load();
  if (S.usdCard && +S.usdCard.balanceUSD > 0 && !S.usdCard.startUSD) S.usdCard.startUSD = S.usdCard.balanceUSD;
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

  // ---------- utilidades ----------
  function mx(n) { n = Math.round(+n || 0); return (n < 0 ? '-$' : '$') + Math.abs(n).toLocaleString('es-MX'); }
  function usd(n) { return 'US$' + (+n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function uid() { return Math.random().toString(36).slice(2, 9); }
  function fdate(d) { return d.getDate() + ' ' + ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][d.getMonth()]; }
  function getPath(o, p) { return p.split('.').reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
  function setPath(o, p, v) {
    var ks = p.split('.'), last = ks.pop();
    var t = ks.reduce(function (a, k) { return a[k]; }, o);
    t[last] = v;
  }
  function pctBar(v, t, over) {
    var p = t > 0 ? Math.min(100, Math.max(0, v / t * 100)) : 0;
    return '<div class="bar' + (over ? ' over' : '') + '"><i style="width:' + p.toFixed(0) + '%"></i></div>';
  }
  function inp(path, label, type) {
    type = type || 'number';
    var v = getPath(S, path);
    if (type === 'pct') v = v == null ? '' : +(v * 100).toFixed(2);
    var t = type === 'pct' ? 'number' : type;
    var step = (type === 'number' || type === 'pct') ? ' step="any" inputmode="decimal"' : '';
    return '<label>' + esc(label) + '<input type="' + t + '"' + step + ' data-f="' + path + '" data-t="' + type + '" value="' + esc(v == null ? '' : v) + '"></label>';
  }
  function monday(d) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); var w = (x.getDay() + 6) % 7; x.setDate(x.getDate() - w); return x; }

  function core() {
    var now = new Date();
    var rows = L.projection(S, now, 120);
    return { now: now, rows: rows, r: rows[0] };
  }

  // ---------- vistas ----------
  function flame() { return '<svg viewBox="0 0 24 24"><path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-4 3-6 1 1 1 2 2 2 1-2 1-5 1-8z" fill="currentColor"/></svg>'; }
  function hud() {
    var xp = L.xpTotal(S), li = L.levelInfo(xp), st = L.streak(S, new Date());
    return '<div class="hud"><div class="lvl" title="Nivel"><b>' + li.level + '</b></div><div class="xp"><div class="xpbar"><i style="width:' + (li.into / li.need * 100).toFixed(0) + '%"></i></div><span>' + LEVELS[Math.min(LEVELS.length - 1, li.level - 1)] + ' · ' + li.into + '/' + li.need + ' XP</span></div><div class="streak' + (st > 0 ? ' on' : '') + '" title="Días seguidos">' + flame() + '<b>' + st + '</b></div></div>';
  }
  function palm(x, flip) {
    var t = flip ? 'translate(' + (360 - x) + ',0) scale(-1,1)' : 'translate(' + x + ',0)';
    return '<g transform="' + t + '" fill="none" stroke="#0b0418" stroke-linecap="round"><path d="M0 220 Q10 140 30 70" stroke-width="8"/>' +
      '<path d="M30 70 Q8 48 -22 62" stroke-width="6"/><path d="M30 70 Q14 38 -8 34" stroke-width="6"/><path d="M30 70 Q34 34 52 22" stroke-width="6"/>' +
      '<path d="M30 70 Q58 44 84 56" stroke-width="6"/><path d="M30 70 Q60 70 78 92" stroke-width="6"/><path d="M30 70 Q2 76 -14 96" stroke-width="6"/></g>';
  }
  function scene(fill, flash) {
    var y = ((1 - fill) * 112).toFixed(1), bars = '', grid = '', i;
    [[100, 2], [108, 3], [116, 4], [124, 5], [132, 6], [140, 7]].forEach(function (b) { bars += '<rect x="120" y="' + b[0] + '" width="120" height="' + b[1] + '" fill="#000"/>'; });
    [158, 165, 174, 185, 199, 216].forEach(function (yy) { grid += '<path d="M0 ' + yy + ' H360" stroke="#ff3d8b" stroke-opacity=".38" stroke-width="1.5"/>'; });
    for (i = -4; i <= 4; i++) grid += '<path d="M180 150 L' + (180 + i * 70) + ' 220" stroke="#ff3d8b" stroke-opacity=".28" stroke-width="1.5"/>';
    return '<svg class="scene" viewBox="0 0 360 220" role="img" aria-label="Atardecer: el sol baja cuando gastas">' +
      '<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b0a46"/><stop offset=".55" stop-color="#8a1f86"/><stop offset=".85" stop-color="#ff4d8d"/><stop offset="1" stop-color="#ff9a4d"/></linearGradient>' +
      '<linearGradient id="sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe066"/><stop offset=".5" stop-color="#ff8a3d"/><stop offset="1" stop-color="#ff3d8b"/></linearGradient>' +
      '<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a1470"/><stop offset="1" stop-color="#2a0b4a"/></linearGradient>' +
      '<clipPath id="above"><rect x="0" y="0" width="360" height="150"/></clipPath>' +
      '<mask id="sm" maskUnits="userSpaceOnUse" x="100" y="20" width="160" height="140"><rect x="100" y="20" width="160" height="140" fill="#fff"/>' + bars + '</mask></defs>' +
      '<rect width="360" height="150" fill="url(#sky)"/>' +
      '<g fill="#fff" fill-opacity=".8"><circle cx="40" cy="24" r="1.4"/><circle cx="96" cy="14" r="1.1"/><circle cx="150" cy="30" r="1.2"/><circle cx="240" cy="18" r="1.4"/><circle cx="300" cy="34" r="1.1"/><circle cx="330" cy="12" r="1.3"/></g>' +
      '<g clip-path="url(#above)"><g id="fillg" data-fill="' + fill + '" style="transform:translateY(' + y + 'px)"><circle cx="180" cy="90" r="50" fill="url(#sun)" mask="url(#sm)"/></g></g>' +
      '<rect y="150" width="360" height="70" fill="url(#sea)"/>' + grid +
      '<g stroke="#ffb15a" stroke-linecap="round" stroke-opacity=".85"><path d="M150 156 H210" stroke-width="3"/><path d="M162 164 H198" stroke-width="2.5"/><path d="M170 173 H190" stroke-width="2"/></g>' +
      palm(-6, false) + palm(-6, true) + '</svg>';
  }

  function viewHoy() {
    var c = core(), now = c.now, r = c.r;
    var out = hud();
    if (!(+S.income > 0)) {
      return out + '<h1>Bienvenido</h1><div class="card"><h2>1. Carga tu plan</h2><p class="mute">Copia tu código del chat, ábrelo aquí con un toque y ya queda todo: ingresos, pagos, metas y gastos.</p>' +
        '<button class="full gold" data-a="pastecode">Pegar mi código</button>' +
        '<label>¿No te deja pegar? Pégalo aquí<textarea id="imp2" rows="3" placeholder="SF1:..."></textarea></label><button class="sec full" data-a="import2">Cargar plan</button>' +
        (ui.msg ? '<div class="note">' + esc(ui.msg) + '</div>' : '') + '</div>' +
        '<div class="card"><h2>2. O empieza desde cero</h2><p class="mute">Captura tu ingreso y tus gastos fijos en Ajustes.</p><button class="sec full" data-a="goto" data-v="ajustes">Ir a Ajustes</button></div>';
    }
    var allowance = r.funPool / L.WEEKS;
    var wk = monday(now), wkEnd = new Date(wk.getFullYear(), wk.getMonth(), wk.getDate() + 7);
    var list = S.expenses.filter(function (e) { var d = L.parseDate(e.date); return d >= wk && d < wkEnd; });
    var spent = list.reduce(function (a, e) { return a + (+e.amount || 0); }, 0);
    var left = allowance - spent;
    var fill = allowance > 0 ? Math.max(0, Math.min(1, left / allowance)) : 0;
    var coin = !!(ui.toast && ui.toast.coin);
    out += '<section class="hero' + (left < 0 ? ' over' : '') + (coin ? ' flash' : '') + '">' + scene(ui.prevFill, coin) +
      '<div class="txt"><div class="big">' + mx(left) + '</div><div class="lab">' + (left < 0 ? 'Se puso el sol: te pasaste esta semana' : 'Disponible esta semana sin culpa') + '</div>' +
      '<div class="sub">Llevas ' + mx(spent) + ' de ' + mx(allowance) + '</div></div></section>';
    ui.targetFill = fill;
    if (r.shortfall > 0) out += '<div class="note">Este mes tus obligaciones superan tu ingreso por ' + mx(r.shortfall) + '. Revisa la pestaña Plan.</div>';
    else if (r.floorShort > 1) out += '<div class="note">Tu colchón sin culpa queda ' + mx(r.floorShort) + ' por debajo de tu mínimo. Mira las palancas en Plan.</div>';

    var todayKey = L.dayKey(now);
    var has = S.expenses.some(function (e) { return e.date === todayKey; }) || S.noSpend.indexOf(todayKey) >= 0;
    var days = 0; for (var i = 0; i < 7; i++) { var dd = new Date(wk.getFullYear(), wk.getMonth(), wk.getDate() + i); if (dd <= now && (S.expenses.some(function (e) { return e.date === L.dayKey(dd); }) || S.noSpend.indexOf(L.dayKey(dd)) >= 0)) days++; }
    out += '<div class="quest' + (has ? ' done' : '') + '"><div class="ic">' + (has ? '✅' : '🎯') + '</div><div style="flex:1"><h2>' + (has ? 'Reto de hoy cumplido' : 'Reto de hoy') + '</h2><div class="mute small">' + (has ? days + ' de 7 días con registro esta semana.' : 'Registra lo que gastes, o confirma que hoy no gastaste.') + '</div></div>' + (has ? '' : '<button class="gold" data-a="nospend">Hoy no gasté</button>') + '</div>';

    out += '<div class="card"><h2>Registrar gasto</h2><label>Monto<input id="q-amt" type="number" inputmode="decimal" step="any" placeholder="0" value="' + esc(ui.amt) + '"></label>' +
      '<label>¿En qué fue?</label>' + tiles(TIPOS, ui.tipo, 'tipo') +
      (ui.more ? '<label>Pagado con</label>' + tiles(METODOS, ui.met, 'met', function (m) { return EMO[m.k]; }) +
        '<label>Fecha<input id="q-date" type="date" max="' + todayKey + '" value="' + esc(ui.date || todayKey) + '"></label>' +
        '<label>Nota (opcional)<input id="q-note" type="text" placeholder="Detalle" value="' + esc(ui.note) + '"></label>'
        : '<div class="row"><span class="mute">Con <b>' + pick(METODOS, ui.met).n + '</b>, hoy</span><button class="chip" data-a="more">Cambiar</button></div>') +
      '<div class="mute small">Cuenta en el sobre de ' + esc(L.ENV_NAMES[pick(TIPOS, ui.tipo).env].split(' ')[0]) + (pick(METODOS, ui.met).cash ? ' y baja tu dinero disponible.' : '. Con tarjeta de crédito no baja tu efectivo; sube la cuenta que pagas después.') + '</div>' +
      '<button class="full" data-a="addexp">Guardar gasto</button>' + (ui.msg ? '<div class="mute">' + esc(ui.msg) + '</div>' : '') + '</div>';

    out += viewCountdown();

    if (list.length) {
      out += '<div class="card"><h2>Esta semana</h2>' + list.slice().reverse().map(function (e) {
        return '<div class="row"><span>' + tipoOf(e).e + ' ' + esc(tipoOf(e).n) + (e.note ? ' · ' + esc(e.note) : '') + '<br><span class="mute small">' + fdate(L.parseDate(e.date)) + (pick(METODOS, e.met) ? ' · ' + pick(METODOS, e.met).n : '') + '</span></span><span><b>' + mx(e.amount) + '</b> <button class="del" data-a="delexp" data-v="' + e.id + '">✕</button></span></div>';
      }).join('') + '</div>';
    }
    return out;
  }

  function clamp01(x) { return isFinite(x) ? Math.max(0, Math.min(1, x)) : 0; }
  function milestones(c) {
    var r = c.r, ms = [], fm = L.fixedTotal(S, r.idx) || 1;
    S.upcoming.forEach(function (u) { var amt = +u.amount || 0, paid = +u.paid || 0; ms.push({ icon: '🛡️', title: 'Paga: ' + u.name, sub: mx(paid) + ' de ' + mx(amt), pct: amt > 0 ? paid / amt : 0 }); });
    ms.push({ icon: '🧱', title: 'Colchón de 1 mes', sub: mx(S.emergency.saved) + ' de ' + mx(fm), pct: S.emergency.saved / fm });
    var u = S.usdCard;
    if (+u.balanceUSD > 0 || +u.startUSD > 0) { var st = +u.startUSD || +u.balanceUSD; ms.push({ icon: '😈', title: 'Tarjeta de EUA en cero', sub: usd(u.balanceUSD) + ' por pagar', pct: 1 - u.balanceUSD / st }); }
    S.goals.forEach(function (g) { ms.push({ icon: '✈️', title: g.name, sub: mx(g.saved) + ' de ' + mx(g.target), pct: g.target > 0 ? g.saved / g.target : 0 }); });
    var tgt = L.emergencyTarget(S, r.idx);
    ms.push({ icon: '🌳', title: 'Fondo de emergencia completo', sub: mx(S.emergency.saved) + ' de ' + mx(tgt), pct: tgt > 0 ? S.emergency.saved / tgt : 0 });
    var cur = +S.retirement.current || 0;
    ms.push({ icon: '🌱', title: 'Primeros $10,000 de ahorro e inversión', sub: mx(cur) + ' de $10,000', pct: cur / 10000 });
    if (S.car.price > 0) { var ce = L.carEval(S.car, r.income); ms.push({ icon: '🚗', title: 'Enganche: ' + (S.car.name || 'auto'), sub: mx(cur) + ' de ' + mx(ce.down), pct: ce.down > 0 ? cur / ce.down : 0 }); }
    var wt = S.wishlist.reduce(function (t, w) { return t + (+w.need || 0); }, 0);
    if (wt > 0) ms.push({ icon: '🎮', title: 'Sin prisa: ' + S.wishlist.map(function (w) { return w.name.replace(/ \(.*\)/, ''); }).join(' + '), sub: mx(S.wishSaved) + ' de ' + mx(wt), pct: (+S.wishSaved || 0) / wt });
    var found = false;
    ms.forEach(function (m) { m.pct = clamp01(m.pct); m.done = m.pct >= 0.999; if (!m.done && !found) { m.now = true; found = true; } });
    return ms;
  }
  function cartas(c) {
    var r = c.r, st = L.bestStreak(S), dep = L.savedReal(S), fm = L.fixedTotal(S, r.idx) || 1, em = S.emergency;
    function paid(id) { var u = S.upcoming.filter(function (x) { return x.id === id; })[0]; return !!u && (+u.amount > 0) && (+u.paid >= +u.amount - 0.5); }
    var u = S.usdCard, tgt = L.emergencyTarget(S, r.idx);
    return [
      { n: 1, e: '🌱', t: 'El Primer Paso', d: 'Registra tu primer gasto', ok: S.expenses.length >= 1 },
      { n: 2, e: '🔥', t: 'La Racha', d: '3 días seguidos', ok: st >= 3 },
      { n: 3, e: '☄️', t: 'El Cometa', d: '7 días seguidos', ok: st >= 7 },
      { n: 4, e: '🪙', t: 'La Moneda', d: 'Tu primer ahorro', ok: dep.ahorro > 0 },
      { n: 5, e: '🛡️', t: 'El Escudo', d: 'Paga la tarjeta Nu de diciembre', ok: paid('nu-dic') },
      { n: 6, e: '🔒', t: 'El Candado', d: 'Paga el mínimo de Discover', ok: paid('disc-min') },
      { n: 7, e: '🧱', t: 'El Colchón', d: '1 mes de gastos ahorrado', ok: em.saved >= fm },
      { n: 8, e: '✈️', t: 'El Avión', d: 'Completa tu meta de viaje', ok: S.goals.some(function (g) { return +g.target > 0 && +g.saved >= +g.target; }) },
      { n: 9, e: '😈', t: 'El Diablito', d: 'Tarjeta de EUA en cero', ok: (+u.startUSD > 0) && +u.balanceUSD <= 0 },
      { n: 10, e: '🌳', t: 'El Árbol', d: 'Fondo de emergencia completo', ok: tgt > 0 && em.saved >= tgt },
      { n: 11, e: '☀️', t: 'El Sol', d: '$10,000 ahorrados en total', ok: dep.ahorro >= 10000 },
      { n: 12, e: '👑', t: 'La Corona', d: 'Llega al nivel 10', ok: L.levelInfo(L.xpTotal(S)).level >= 10 },
      { n: 13, e: '🎮', t: 'El Control', d: 'Junta tu meta sin prisa', ok: S.wishlist.length > 0 && S.wishlist.reduce(function (t, w) { return t + (+w.need || 0); }, 0) > 0 && (+S.wishSaved || 0) >= S.wishlist.reduce(function (t, w) { return t + (+w.need || 0); }, 0) }
    ];
  }

  function viewCamino() {
    var c = core(), out = hud(), real = L.savedReal(S), li = L.levelInfo(L.xpTotal(S));
    out += '<h1>Tu camino</h1><div class="stats"><div class="stat"><span class="mute small">Ahorrado de verdad</span><b class="ok">' + mx(real.ahorro) + '</b></div><div class="stat"><span class="mute small">Deuda pagada</span><b>' + mx(real.deuda) + '</b></div></div>' +
      '<p class="mute">Los puntos solo se ganan por hábitos reales: registrar, no gastar, ahorrar y pagar deuda. Nada premia gastar más.</p>';
    out += '<div class="path">' + milestones(c).map(function (m) {
      var cls = m.done ? 'done' : m.now ? 'now' : 'lock';
      return '<div class="node ' + cls + '"><div class="disc">' + (m.done ? '⭐' : m.icon) + '</div><div>' + (m.now ? '<span class="tag">Ahora</span><br>' : '') + '<h3>' + esc(m.title) + '</h3><p>' + esc(m.sub) + '</p>' + (m.done ? '' : '<div class="mini"><i style="width:' + (m.pct * 100).toFixed(0) + '%"></i></div>') + '</div></div>';
    }).join('') + '</div>';
    var cs = cartas(c), got = cs.filter(function (x) { return x.ok; }).length;
    out += '<div class="sect">Cartas de lotería · ' + got + '/' + cs.length + '</div><div class="lot">' + cs.map(function (x) {
      return '<div class="carta ' + (x.ok ? 'got' : 'lock') + '"><span class="n">' + x.n + '</span><span class="em">' + x.e + '</span><h3>' + x.t + '</h3><p>' + x.d + '</p></div>';
    }).join('') + '</div>';
    return out;
  }

  function viewCountdown() {
    var cd = L.countdown(S, new Date());
    var out = '<div class="card"><h2>Próximos pagos</h2>';
    out += '<div class="grid2"><label>Dinero disponible hoy<input type="number" inputmode="decimal" step="any" data-f="cash.amount" data-t="number" value="' + esc(S.cash.amount) + '"></label>' +
      '<label>Próximo ingreso (monto)<input type="number" inputmode="decimal" step="any" data-f="nextIncome.amount" data-t="number" value="' + esc(S.nextIncome.amount) + '"></label></div>' +
      '<label>Fecha del próximo ingreso<input type="date" data-f="nextIncome.date" data-t="date" value="' + esc(S.nextIncome.date) + '"></label>';
    if (!cd.items.length) return out + '<p class="mute">No tienes pagos pendientes capturados. Agrégalos en Ajustes.</p></div>';
    out += cd.items.map(function (it) {
      var cls = it.gap > 0 ? 'bad' : 'ok';
      return '<div class="item"><div class="row"><span><b>' + esc(it.name) + '</b><br><span class="mute small">' + fdate(it.date) + ' · ' + (it.days < 0 ? 'vencido' : it.days === 0 ? 'hoy' : 'en ' + it.days + ' días') + '</span></span><b>' + mx(it.pending) + '</b></div>' +
        '<div class="' + cls + ' small">' + (it.gap > 0 ? 'Con lo que tienes y lo que llega antes de esa fecha, faltan ' + mx(it.gap) + ' (sumando los pagos anteriores).' : 'Cubierto con tu dinero disponible.') + '</div>' +
        '<div class="grid2"><input type="number" inputmode="decimal" step="any" placeholder="Abonar $" id="pay-' + it.id + '"><button class="sec" data-a="pay" data-v="' + it.id + '">Registrar abono</button></div></div>';
    }).join('');
    return out + '<p class="mute small">Al registrar un abono, se descuenta también de tu dinero disponible.</p></div>';
  }

  function viewPlan() {
    var c = core(), r = c.r, rows = c.rows;
    var out = '<h1>Plan de ' + esc(r.label) + '</h1>';
    if (!(+S.income > 0)) return out + '<div class="card"><p class="mute">Captura tu ingreso en Ajustes.</p></div>';
    out += '<div class="card">';
    out += row('Ingreso', r.income);
    out += row('Gastos fijos y viajes', -r.fixed);
    if (r.inst) out += row('Mensualidades de tarjeta', -r.inst);
    if (r.usdMXN) out += row('Pago tarjeta EUA', -r.usdMXN);
    r.goalLines.forEach(function (g) { out += row('Meta: ' + g.name, -g.amount); });
    out += '<div class="row"><span><b>Te queda</b></span><b class="' + (r.R < 0 ? 'bad' : 'ok') + '">' + mx(r.R) + '</b></div>';
    out += '</div>';

    if (r.shortfall > 0) out += '<div class="note"><b>No alcanza:</b> faltan ' + mx(r.shortfall) + ' para cubrir lo obligatorio este mes.</div>';

    var lev = L.levers(S, r);
    if (lev.gap > 0) {
      out += '<div class="card"><h2>Para llegar a tu mínimo sin culpa</h2><p class="mute">Te faltan ' + mx(lev.gap) + ' al mes para llegar a tu mínimo recomendado de ' + mx(r.floor) + ' (' + mx(r.floor / L.WEEKS) + ' por semana). Opciones, tú eliges:</p>';
      lev.list.forEach(function (l) {
        if (l.type === 'income') out += '<div class="item">Ingreso extra de <b>' + mx(l.amount) + '</b> al mes.</div>';
        if (l.type === 'usd') out += '<div class="item">Bajar el pago a la tarjeta EUA en ' + mx(l.cut) + ' (a ' + mx(l.newPay) + '/mes). ' + (l.monthsAfter && l.monthsNow ? 'Pasarías de ~' + l.monthsNow + ' a ~' + l.monthsAfter + ' meses' + (l.hasApr ? ', con ~' + usd(l.interestExtraUSD) + ' más de intereses.' : '.') : 'Revisa que el pago cubra los intereses.') + '</div>';
        if (l.type === 'goal') out += '<div class="item">Alargar "' + esc(l.name) + '" un mes más: ahorras ' + mx(l.save) + ' al mes.</div>';
      });
      out += '</div>';
    }

    var env = L.envelopes(S, r);
    out += '<div class="card"><h2>Tu dinero sin culpa: ' + mx(r.funPool) + '</h2><p class="mute">Ahorro del mes: ' + mx(r.savePool) + (r.extraFun + r.extraSave > 0 ? ' (lo que sobra sobre tu mínimo se reparte mitad y mitad)' : '') + '</p><table><tr><th></th><th>Mes</th><th>Veces</th><th>Por vez</th></tr>' +
      L.ENV_KEYS.map(function (k) { var e = env[k]; return '<tr><td>' + L.ENV_NAMES[k].split(' ')[0] + '</td><td>' + mx(e.amount) + '</td><td>' + e.times + '</td><td>' + mx(e.perTime) + '</td></tr>'; }).join('') + '</table>' +
      '<p class="mute small">El reparto en porcentajes y las veces son supuestos tuyos: edítalos en Ajustes.</p></div>';

    out += '<div class="card"><h2>Próximos meses</h2><table><tr><th>Mes</th><th>Te queda</th><th>Sin culpa</th><th>Ahorro</th></tr>' +
      rows.slice(0, 8).map(function (x) { return '<tr><td>' + x.label + '</td><td class="' + (x.R < 0 ? 'bad' : '') + '">' + mx(x.R) + '</td><td>' + mx(x.funPool) + '</td><td>' + mx(x.savePool) + '</td></tr>'; }).join('') + '</table></div>';
    return out;
    function row(a, b) { return '<div class="row"><span>' + esc(a) + '</span><b>' + mx(b) + '</b></div>'; }
  }

  function viewMetas() {
    var c = core(), r = c.r, rows = c.rows;
    var out = '<h1>Metas</h1>';
    // metas con fecha
    S.goals.forEach(function (g, i) {
      var pct = g.target > 0 ? (g.saved / g.target * 100) : 0;
      var line = r.goalLines.filter(function (x) { return x.name === g.name; })[0];
      out += '<div class="card"><h2>' + esc(g.name) + '</h2><div class="big">' + mx(g.saved) + ' <span class="mute">/ ' + mx(g.target) + '</span></div>' + pctBar(g.saved, g.target) +
        '<div class="mute">' + pct.toFixed(0) + '%' + (g.deadline ? ' · fecha ' + fdate(L.parseDate(g.deadline)) : '') + (line ? ' · aportación por mes: <b>' + mx(line.amount) + '</b>' : '') + '</div>' +
        '<div class="grid2"><input type="number" inputmode="decimal" step="any" placeholder="Abonar $" id="g-' + i + '"><button class="sec" data-a="goalpay" data-v="' + i + '">Abonar</button></div></div>';
    });
    // emergencia
    var tgt = L.emergencyTarget(S, r.idx);
    var em = S.emergency;
    out += '<div class="card"><h2>Fondo de emergencia</h2><div class="big">' + mx(em.saved) + ' <span class="mute">/ ' + mx(tgt) + '</span></div>' + pctBar(em.saved, tgt) +
      '<div class="mute">Meta: ' + em.months + ' meses de gastos fijos. Se llena con el ahorro del mes.</div>' +
      '<div class="grid2"><input type="number" inputmode="decimal" step="any" placeholder="Abonar $" id="em-pay"><button class="sec" data-a="empay">Abonar</button></div></div>';

    // cola de ahorro: emergencia, luego auto
    var car = S.car, ce = L.carEval(car, r.income);
    var queue = [{ name: 'Fondo de emergencia', need: Math.max(0, tgt - em.saved) }];
    if (car.price > 0) queue.push({ name: (car.name || 'Auto') + ' (enganche)', need: ce.down });
    var eta = L.etaQueue(rows, queue, function (x) { return x.savePool; });
    out += '<div class="card"><h2>¿Cuándo alcanza el ahorro?</h2><p class="mute">Según tu ahorro mensual de hoy (' + mx(r.savePool) + '), en este orden:</p>' +
      eta.map(function (e) { return '<div class="row"><span>' + esc(e.name) + '<br><span class="mute small">' + mx(e.need) + '</span></span><b>' + (e.idx == null ? 'más de 10 años' : L.labelMonth(e.idx)) + '</b></div>'; }).join('') + '</div>';

    if (car.price > 0) {
      out += '<div class="card"><h2>' + esc(car.name || 'Auto') + '</h2>' +
        row2('Precio', mx(ce.price)) + row2('Enganche (' + car.downPct + '%)', mx(ce.down)) + row2('Mensualidad ' + car.months + ' meses', mx(ce.payment)) +
        row2('Ingreso para que sea ≤ 20%', mx(ce.incomeNeeded)) +
        '<p class="mute small">La mensualidad usa la tasa que pongas (' + (car.apr * 100).toFixed(1) + '%); no incluye seguro, mantenimiento ni trámites. Pide cotización real.</p></div>';
    }

    // deseos: meta sin prisa con su propia alcancía
    if (S.wishlist.length) {
      var wtot = S.wishlist.reduce(function (t, w) { return t + (+w.need || 0); }, 0), rest = +S.wishSaved || 0;
      var q2 = S.wishlist.map(function (w) { var need = Math.max(0, (+w.need || 0) - rest); rest = Math.max(0, rest - (+w.need || 0)); return { name: w.name, need: need, full: +w.need || 0 }; });
      var e2 = L.etaQueue(rows, q2, function (x) { return L.envelopes(S, x).gustos.amount; });
      out += '<div class="card"><h2>Sin prisa: ' + esc(S.wishlist.map(function (w) { return w.name.replace(/ \(.*\)/, ''); }).join(' + ')) + '</h2>' +
        '<div class="big">' + mx(S.wishSaved) + ' <span class="mute">/ ' + mx(wtot) + '</span></div>' + pctBar(S.wishSaved, wtot) +
        '<p class="mute">No es prioridad: se paga del sobre de Gustos (' + mx(L.envelopes(S, r).gustos.amount) + ' al mes hoy, y crece cuando termines tarjeta y Colombia). Págalo de contado, no con la tarjeta Nu.</p>' +
        e2.map(function (e) { return '<div class="row"><span>' + esc(e.name) + '<br><span class="mute small">faltan ' + mx(e.need) + '</span></span><b>' + (e.need <= 0 ? 'Listo' : e.idx == null ? 'más de 10 años' : L.labelMonth(e.idx)) + '</b></div>'; }).join('') +
        '<div class="grid2"><input type="number" inputmode="decimal" step="any" placeholder="Apartar $" id="wish-amt"><button class="gold" data-a="wish">Apartar</button></div></div>';
    }

    out += '<div class="card"><h2>Ahorro e inversión</h2><div class="big ok">' + mx(S.retirement.current) + '</div><p class="mute">Lo que ya apartaste en cajitas, CETES, Afore u otra inversión. Cada aportación suma XP.</p><div class="grid2"><input type="number" inputmode="decimal" step="any" placeholder="Aportar $" id="sv-amt"><button data-a="save">Aportar</button></div></div>';
    // retiro
    var rt = S.retirement, f = L.retirementFV(rt);
    out += '<div class="card"><h2>Retiro</h2><div class="grid2">' + inp('retirement.monthly', 'Aportación mensual $') + inp('retirement.years', 'Años') + inp('retirement.current', 'Ya tengo $') + inp('retirement.realReturn', 'Rendimiento real anual %') + '</div>' +
      '<div class="row"><span>Aportarías</span><b>' + mx(f.contributed) + '</b></div><div class="row"><span>Tendrías (en pesos de hoy)</span><b>' + mx(f.fv) + '</b></div><div class="row"><span>Renta mensual aprox. (regla del 4%)</span><b>' + mx(f.monthlyIncome4) + '</b></div>' +
      '<p class="mute small">El rendimiento real es un supuesto tuyo (rendimiento menos inflación) y puede ser menor o negativo. No es una promesa ni una recomendación de producto.</p></div>';
    out += '<div class="sect">Tarjeta en dólares</div>' + viewTarjeta().replace('<h1>Tarjeta en dólares</h1>', '');
    return out;
    function row2(a, b) { return '<div class="row"><span>' + a + '</span><b>' + b + '</b></div>'; }
  }

  function viewTarjeta() {
    var u = S.usdCard, fx = +u.fx || 18;
    var out = '<h1>Tarjeta en dólares</h1>';
    if (!(+u.balanceUSD > 0)) return out + '<div class="card"><p class="mute">Sin saldo pendiente, o captura saldo y tasa en Ajustes.</p></div>';
    var payUSD = (+u.monthlyMXN || 0) / fx;
    var now = L.usdPayoff(u.balanceUSD, u.apr || 0, payUSD);
    out += '<div class="card"><div class="mute">' + esc(u.name) + '</div><div class="big">' + usd(u.balanceUSD) + '</div><div class="mute">≈ ' + mx(u.balanceUSD * fx) + ' a ' + fx + ' MXN/USD · tasa ' + (u.apr == null ? '¿?' : (u.apr * 100).toFixed(2) + '%') + (u.minUSD ? ' · mínimo ' + usd(u.minUSD) : '') + '</div>' +
      '<div class="note good">Con ' + mx(u.monthlyMXN) + ' al mes: ' + (now.months ? 'la liquidas en ~' + now.months + ' meses, con ~' + usd(now.interestUSD) + ' de intereses.' : 'el pago no cubre los intereses.') + '</div></div>';
    var sc = [];
    if (u.minUSD) sc.push(['Solo el mínimo', u.minUSD * fx]);
    [3000, 5000, 7000].forEach(function (m) { sc.push([mx(m) + ' al mes', m]); });
    out += '<div class="card"><h2>Comparación</h2><table><tr><th>Pago</th><th>Meses</th><th>Intereses</th></tr>' + sc.map(function (s) {
      var p = L.usdPayoff(u.balanceUSD, u.apr || 0, s[1] / fx);
      return '<tr><td>' + s[0] + '</td><td>' + (p.months == null ? '—' : p.months) + '</td><td>' + usd(p.interestUSD) + '</td></tr>';
    }).join('') + '</table><p class="mute small">Cálculo con tasa fija (la tuya es variable) y tipo de cambio fijo. Si pagas en dólares directamente evitas comisiones de conversión.</p></div>';
    out += '<div class="card"><div class="grid2">' + inp('usdCard.monthlyMXN', 'Pago mensual (MXN)') + inp('usdCard.fx', 'Tipo de cambio') + '</div>' +
      '<h3>Registrar un pago hecho</h3><div class="grid2"><input type="number" inputmode="decimal" step="any" placeholder="Pagué $ (MXN)" id="usd-pay"><button data-a="usdpay">Registrar</button></div><p class="mute small">Baja el saldo según el tipo de cambio. Si tu estado de cuenta dice otra cifra, corrígela en Ajustes.</p></div>';
    return out;
  }

  function listEditor(title, path, fields, blank) {
    var arr = getPath(S, path) || [];
    var out = '<div class="card"><h2>' + title + '</h2>';
    arr.forEach(function (it, i) {
      out += '<div class="item">' + fields.map(function (f) { return inp(path + '.' + i + '.' + f[0], f[1], f[2]); }).join('') +
        '<button class="del" data-a="rm" data-p="' + path + '" data-v="' + i + '">Quitar</button></div>';
    });
    return out + '<button class="sec full" data-a="add" data-p="' + path + '" data-b=\'' + esc(JSON.stringify(blank)) + '\'>+ Agregar</button></div>';
  }

  function viewAjustes() {
    var out = '<h1>Ajustes</h1>';
    out += '<div class="card"><h2>Ingresos</h2><div class="grid2">' + inp('income', 'Ingreso mensual $') + inp('extra', 'Ingreso extra mensual $') + inp('payday', 'Día de cobro') + '</div><p class="mute small">Tu mínimo sin culpa y tu ahorro los calcula la app sola: 10% de tu ingreso para cada uno. No tienes que definirlos.</p></div>';
    out += listEditor('Gastos fijos', 'fixed', [['name', 'Nombre', 'text'], ['amount', 'Monto mensual $'], ['startMonth', 'Desde (opcional)', 'month'], ['endMonth', 'Hasta (opcional)', 'month']], { name: '', amount: 0 });
    out += '<div class="card"><h2>Viajes</h2><div class="grid2">' + inp('trips.count', 'Viajes al mes') + inp('trips.tolls', 'Casetas por viaje') + inp('trips.gas', 'Gasolina por viaje') + inp('trips.food', 'Comida por viaje') + '</div></div>';
    out += listEditor('Mensualidades de tarjeta (MSI, planes)', 'installments', [['name', 'Nombre', 'text'], ['monthly', 'Monto $'], ['startMonth', 'Desde', 'month'], ['endMonth', 'Hasta', 'month']], { name: '', monthly: 0 });
    out += listEditor('Pagos próximos', 'upcoming', [['name', 'Nombre', 'text'], ['amount', 'Monto $'], ['paid', 'Ya abonado $'], ['date', 'Fecha límite', 'date']], { id: uid(), name: '', amount: 0, paid: 0, date: '' });
    out += '<div class="card"><h2>Tarjeta en dólares</h2><div class="grid2">' + inp('usdCard.name', 'Nombre', 'text') + inp('usdCard.balanceUSD', 'Saldo US$') + inp('usdCard.apr', 'Tasa anual %', 'pct') + inp('usdCard.minUSD', 'Pago mínimo US$') + inp('usdCard.fx', 'Tipo de cambio') + inp('usdCard.monthlyMXN', 'Pago mensual $') + '</div></div>';
    out += listEditor('Metas con fecha', 'goals', [['name', 'Nombre', 'text'], ['target', 'Meta $'], ['saved', 'Llevo $'], ['deadline', 'Fecha', 'date']], { name: '', target: 0, saved: 0, deadline: '' });
    out += '<div class="card"><h2>Emergencia</h2><div class="grid2">' + inp('emergency.months', 'Meses de gastos') + inp('emergency.saved', 'Llevo $') + '</div></div>';
    out += listEditor('Deseos', 'wishlist', [['name', 'Nombre', 'text'], ['need', 'Precio estimado $']], { name: '', need: 0 });
    out += '<div class="card"><h2>Auto</h2><div class="grid2">' + inp('car.name', 'Modelo', 'text') + inp('car.price', 'Precio $') + inp('car.downPct', 'Enganche %') + inp('car.apr', 'Tasa anual %', 'pct') + inp('car.months', 'Plazo (meses)') + '</div></div>';
    out += '<div class="card"><h2>Reparto del dinero sin culpa</h2><p class="mute">Porcentaje y número de veces al mes (supuestos tuyos).</p><div class="grid2">' +
      L.ENV_KEYS.map(function (k) { return inp('envelopes.' + k + '.pct', L.ENV_NAMES[k].split(' ')[0] + ' %') + inp('envelopes.' + k + '.times', L.ENV_NAMES[k].split(' ')[0] + ' veces'); }).join('') + '</div></div>';
    out += '<div class="card"><h2>Respaldo</h2><p class="mute">Tus datos solo viven en este teléfono. Copia un respaldo de vez en cuando.</p>' +
      '<button class="full" data-a="copy">Copiar respaldo</button><button class="sec full" data-a="download">Descargar archivo</button>' +
      '<label>Importar (pega el respaldo aquí)<textarea id="imp" rows="4"></textarea></label><button class="sec full" data-a="import">Importar</button>' +
      '<label>O elige un archivo<input type="file" id="impfile" accept=".json,application/json"></label>' +
      (ui.msg ? '<div class="note good">' + esc(ui.msg) + '</div>' : '') +
      '<button class="sec full" data-a="refresh">Actualizar la app (versión 8)</button>' +
      '<button class="del full" data-a="reset">Borrar todos mis datos</button></div>';
    return out;
  }

  // ---------- render ----------
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function fx() {
    var h = '';
    if (ui.toast && ui.toast.rain && !reduce) {
      h += '<div class="rain">';
      for (var j = 0; j < 16; j++) h += '<b style="left:' + Math.round(4 + Math.random() * 90) + '%;animation-delay:' + (Math.random() * 0.8).toFixed(2) + 's;font-size:' + (20 + Math.round(Math.random() * 14)) + 'px">' + ui.toast.rain + '</b>';
      h += '</div>';
    }
    if (ui.toast) {
      var t = ui.toast;
      h += '<div class="toast">' + (t.text ? '<span>' + esc(t.text) + '</span>' : '') + (t.coin ? '<span>🪙</span>' : '') + (t.xp > 0 ? '<i>+' + t.xp + ' XP</i>' : '') + (t.cards && t.cards.length ? '<span>Insignia: ' + esc(t.cards.join(', ')) + '</span>' : '') + '</div>';
    }
    if (ui.levelup) {
      var cols = ['#ffc247', '#ff3d8b', '#27e3d0', '#fff', '#ff7a45'], conf = '';
      for (var i = 0; i < 30; i++) conf += '<i style="left:' + Math.round(Math.random() * 100) + '%;background:' + cols[i % cols.length] + ';animation-delay:' + (Math.random() * 2).toFixed(2) + 's;animation-duration:' + (2 + Math.random() * 1.8).toFixed(2) + 's"></i>';
      h += '<div class="modal" role="dialog" aria-label="Subiste de nivel"><div class="conf">' + conf + '</div><div class="box"><div class="lab">¡Subiste de nivel!</div><div class="big">' + ui.levelup + '</div><h2>' + LEVELS[Math.min(LEVELS.length - 1, ui.levelup - 1)] + '</h2><p>Cada hábito cuenta. Sigue así.</p><button class="gold full" data-a="closemodal">Seguir</button></div></div>';
    }
    return h;
  }
  function render() {
    var app = document.getElementById('app');
    var y = window.scrollY;
    var views = { hoy: viewHoy, gastos: viewGastos, camino: viewCamino, plan: viewPlan, metas: viewMetas, ajustes: viewAjustes };
    app.innerHTML = views[tab]();
    document.getElementById('tabs').innerHTML = TABS.map(function (t) { return '<button class="' + (tab === t[0] ? 'on' : '') + '" data-a="goto" data-v="' + t[0] + '">' + ICON[t[0]] + t[1] + '</button>'; }).join('');
    document.getElementById('fx').innerHTML = fx();
    ui.toast = null;
    var g = document.getElementById('fillg');
    if (g && tab === 'hoy') {
      var target = ui.targetFill;
      if (reduce) { g.style.transform = 'translateY(' + ((1 - target) * 112) + 'px)'; }
      else {
        void g.getBoundingClientRect();
        g.style.transition = 'transform 1.3s cubic-bezier(.2,.8,.2,1)';
        requestAnimationFrame(function () { g.style.transform = 'translateY(' + ((1 - target) * 112) + 'px)'; });
      }
      ui.prevFill = target;
    }
    window.scrollTo(0, y);
  }
  function go(t) { tab = t; ui.msg = ''; render(); window.scrollTo(0, 0); }
  function unlocked() { return cartas(core()).filter(function (x) { return x.ok; }).map(function (x) { return x.t; }); }
  function act(fn, coin) {
    var xp0 = L.xpTotal(S), lv0 = L.levelInfo(xp0).level, c0 = unlocked();
    fn();
    save();
    var xp1 = L.xpTotal(S), lv1 = L.levelInfo(xp1).level, c1 = unlocked();
    ui.toast = { xp: xp1 - xp0, coin: !!coin, cards: c1.filter(function (n) { return c0.indexOf(n) < 0; }) };
    if (lv1 > lv0) ui.levelup = lv1;
    render();
  }

  // ---------- gastos e ingresos ----------
  function viewGastos() {
    var n = new Date(), s0 = new Date(n.getFullYear(), n.getMonth() + ui.gm, 1), e0 = new Date(s0.getFullYear(), s0.getMonth() + 1, 1);
    var inR = function (x) { var d = L.parseDate(x.date); return d >= s0 && d < e0; };
    var ex = S.expenses.filter(inR), inc = (S.incomes || []).filter(inR);
    var tg = ex.reduce(function (t, x) { return t + (+x.amount || 0); }, 0), ti = inc.reduce(function (t, x) { return t + (+x.amount || 0); }, 0);
    var byT = {}, byM = {};
    ex.forEach(function (x) { var t = tipoOf(x); byT[t.k] = byT[t.k] || { t: t, v: 0 }; byT[t.k].v += +x.amount || 0; var m = pick(METODOS, x.met); var mk = m ? m.n : 'Sin método'; byM[mk] = (byM[mk] || 0) + (+x.amount || 0); });
    var rows = Object.keys(byT).map(function (k) { return byT[k]; }).sort(function (a, b) { return b.v - a.v; });
    var out = '<h1>Gastos e ingresos</h1><div class="card"><div class="row"><button class="chip" data-a="gmes" data-v="-1">‹</button><b>' + MESES[s0.getMonth()] + ' ' + s0.getFullYear() + '</b><button class="chip" data-a="gmes" data-v="1"' + (ui.gm >= 0 ? ' disabled' : '') + '>›</button></div>' +
      '<div class="row"><span>Gastos</span><b>' + mx(tg) + '</b></div><div class="row"><span>Ingresos registrados</span><b>' + mx(ti) + '</b></div></div>';

    out += '<div class="card"><h2>Registrar ingreso</h2><label>Monto<input id="i-amt" type="number" inputmode="decimal" step="any" placeholder="0" value="' + esc(ui.iamt) + '"></label>' +
      '<label>¿Qué fue?</label>' + tiles(ITIPOS, ui.itipo, 'itipo', function (t) { return EMO[t.k] || '💰'; }) +
      '<label>¿Dónde lo metiste?</label>' + tiles(DESTINOS, ui.idest, 'idest', function (d) { return EMO[d.k]; }) +
      '<label>Fecha<input id="i-date" type="date" max="' + L.dayKey(n) + '" value="' + esc(ui.idate || L.dayKey(n)) + '"></label>' +
      '<label>Nota (opcional)<input id="i-note" type="text" placeholder="Detalle" value="' + esc(ui.inote) + '"></label>' +
      '<div class="mute small">' + (pick(DESTINOS, ui.idest).cash ? 'Suma a tu dinero disponible.' : 'No suma a tu dinero disponible: queda como ahorro o inversión.') + ' No cambia tu ingreso base del plan.</div>' +
      '<button class="full" data-a="addinc">Guardar ingreso</button>' + (ui.msg ? '<div class="mute">' + esc(ui.msg) + '</div>' : '') + '</div>';

    if (rows.length) {
      out += '<div class="card"><h2>En qué se fue</h2>' + rows.map(function (r) {
        return '<div class="row"><span>' + r.t.e + ' ' + esc(r.t.n) + '</span><b>' + mx(r.v) + ' <span class="mute small">' + Math.round(r.v / tg * 100) + '%</span></b></div><div class="bar"><i style="width:' + Math.max(4, Math.round(r.v / tg * 100)) + '%;background:' + r.t.c + '"></i></div>';
      }).join('') + '</div>';
      out += '<div class="card"><h2>Cómo pagaste</h2>' + Object.keys(byM).map(function (k) { return '<div class="row"><span>' + esc(k) + '</span><b>' + mx(byM[k]) + '</b></div>'; }).join('') + '</div>';
    }

    var mov = ex.map(function (x) { return { kind: 'g', x: x }; }).concat(inc.map(function (x) { return { kind: 'i', x: x }; }))
      .filter(function (m) { return ui.gf === 'todo' || (ui.gf === 'gastos' && m.kind === 'g') || (ui.gf === 'ingresos' && m.kind === 'i'); })
      .sort(function (a, b) { return a.x.date < b.x.date ? 1 : a.x.date > b.x.date ? -1 : 0; });
    out += '<div class="card"><h2>Movimientos</h2><div class="chips">' + [['todo', 'Todo'], ['gastos', 'Gastos'], ['ingresos', 'Ingresos']].map(function (f) {
      return '<button class="chip' + (ui.gf === f[0] ? ' on' : '') + '" data-a="gf" data-v="' + f[0] + '">' + f[1] + '</button>';
    }).join('') + '</div>' + (mov.length ? mov.map(function (m) {
      var x = m.x, d = fdate(L.parseDate(x.date));
      if (m.kind === 'g') { var t = tipoOf(x), me = pick(METODOS, x.met); return '<div class="row"><span>' + t.e + ' ' + esc(t.n) + (x.note ? ' · ' + esc(x.note) : '') + '<br><span class="mute small">' + d + (me ? ' · ' + me.n : '') + '</span></span><span><b>-' + mx(x.amount) + '</b> <button class="del" data-a="delexp" data-v="' + x.id + '">✕</button></span></div>'; }
      var it = pick(ITIPOS, x.tipo), de = pick(DESTINOS, x.dest);
      return '<div class="row"><span>💵 ' + esc(it ? it.n : 'Ingreso') + (x.note ? ' · ' + esc(x.note) : '') + '<br><span class="mute small">' + d + (de ? ' · lo metí en ' + de.n : '') + '</span></span><span><b>+' + mx(x.amount) + '</b> <button class="del" data-a="delinc" data-v="' + x.id + '">✕</button></span></div>';
    }).join('') : '<p class="mute">Nada este mes todavía.</p>') + '</div>';
    return out;
  }

  function addDep(kind, amount, name) { S.deposits.push({ id: uid(), date: iso(new Date()), amount: amount, kind: kind, name: name || '' }); }

  // ---------- eventos ----------
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-a]');
    if (!el) return;
    var a = el.dataset.a, v = el.dataset.v;
    function num(id) { var e = document.getElementById(id); return parseFloat(e && e.value); }
    if (a === 'goto') return go(v);
    if (a === 'closemodal') { ui.levelup = 0; return render(); }
    if (a === 'tipo') { ui.tipo = v; return render(); }
    if (a === 'met') { ui.met = v; return render(); }
    if (a === 'itipo') { ui.itipo = v; return render(); }
    if (a === 'idest') { ui.idest = v; return render(); }
    if (a === 'gf') { ui.gf = v; return render(); }
    if (a === 'gmes') { ui.gm = Math.min(0, ui.gm + parseInt(v, 10)); return render(); }
    if (a === 'addinc') {
      var ia = num('i-amt');
      if (!(ia > 0)) { ui.msg = 'Escribe un monto.'; return render(); }
      var idt = document.getElementById('i-date').value || L.dayKey(new Date()); if (idt > L.dayKey(new Date())) idt = L.dayKey(new Date());
      var dd = pick(DESTINOS, ui.idest), delta = dd.cash ? ia : 0;
      if (!S.incomes) S.incomes = []; if (!S.cash) S.cash = { amount: 0 };
      S.incomes.push({ id: uid(), date: idt, amount: ia, tipo: ui.itipo, dest: ui.idest, note: document.getElementById('i-note').value.trim(), cashDelta: delta });
      S.cash.amount = (+S.cash.amount || 0) + delta;
      ui.iamt = ''; ui.inote = ''; ui.idate = ''; ui.msg = ''; save(); ui.toast = { text: '¡Entró lana! +' + mx(ia), rain: dd.cash ? '💰' : '📈' }; return render();
    }
    if (a === 'delinc') {
      var di = (S.incomes || []).filter(function (x) { return x.id === v; })[0];
      if (di) { if (!S.cash) S.cash = { amount: 0 }; S.cash.amount = (+S.cash.amount || 0) - (+di.cashDelta || 0); S.incomes = S.incomes.filter(function (x) { return x.id !== v; }); save(); }
      return render();
    }
    if (a === 'nospend') return act(function () { var k = L.dayKey(new Date()); if (S.noSpend.indexOf(k) < 0) S.noSpend.push(k); });
    if (a === 'addexp') {
      var amt = num('q-amt');
      if (!(amt > 0)) { ui.msg = 'Escribe un monto.'; return render(); }
      return act(function () {
        var tp = pick(TIPOS, ui.tipo), me = pick(METODOS, ui.met), qd = ui.date || iso(new Date());
        if (qd > iso(new Date())) qd = iso(new Date());
        var cd = me.cash ? -amt : 0;
        if (!S.cash) S.cash = { amount: 0 };
        S.cash.amount = (+S.cash.amount || 0) + cd;
        S.expenses.push({ id: uid(), date: qd, amount: amt, env: tp.env, tipo: tp.k, met: me.k, note: (ui.note || '').trim(), cashDelta: cd });
        ui.msg = 'Guardado.'; ui.amt = ''; ui.note = ''; ui.date = '';
      });
    }
    if (a === 'delexp') {
      var dx = S.expenses.filter(function (e) { return e.id === v; })[0];
      if (dx && dx.cashDelta) S.cash.amount = (+S.cash.amount || 0) - dx.cashDelta;
      S.expenses = S.expenses.filter(function (e) { return e.id !== v; }); save(); return render();
    }
    if (a === 'pay') {
      var pa = num('pay-' + v);
      if (!(pa > 0)) return;
      var it = S.upcoming.filter(function (u) { return u.id === v; })[0];
      if (it) act(function () { it.paid = (+it.paid || 0) + pa; S.cash.amount = (+S.cash.amount || 0) - pa; addDep('deuda', pa, it.name); }, true);
      return;
    }
    if (a === 'goalpay') {
      var g = S.goals[+v], am = num('g-' + v);
      if (g && am > 0) act(function () { g.saved = (+g.saved || 0) + am; addDep('meta', am, g.name); }, true);
      return;
    }
    if (a === 'empay') {
      var ea = num('em-pay');
      if (ea > 0) act(function () { S.emergency.saved = (+S.emergency.saved || 0) + ea; addDep('emergencia', ea, 'Emergencia'); }, true);
      return;
    }
    if (a === 'wish') {
      var wa = num('wish-amt');
      if (wa > 0) act(function () { S.wishSaved = (+S.wishSaved || 0) + wa; addDep('meta', wa, 'Sin prisa'); }, true);
      return;
    }
    if (a === 'save') {
      var sa = num('sv-amt');
      if (sa > 0) act(function () { S.retirement.current = (+S.retirement.current || 0) + sa; addDep('ahorro', sa, 'Ahorro e inversión'); }, true);
      return;
    }
    if (a === 'usdpay') {
      var up = num('usd-pay');
      if (up > 0) act(function () { var fx = +S.usdCard.fx || 18; S.usdCard.balanceUSD = Math.max(0, (+S.usdCard.balanceUSD || 0) - up / fx); addDep('deuda', up, S.usdCard.name); }, true);
      return;
    }
    if (a === 'add') { var arr = getPath(S, el.dataset.p); var b = JSON.parse(el.dataset.b); if (b.id) b.id = uid(); arr.push(b); save(); return render(); }
    if (a === 'rm') { getPath(S, el.dataset.p).splice(+v, 1); save(); return render(); }
    if (a === 'copy') {
      var txt = JSON.stringify(S);
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { ui.msg = 'Respaldo copiado. Pégalo en Notas o en un mensaje a ti mismo.'; render(); }, function () { ui.msg = 'No pude copiar. Usa "Descargar archivo".'; render(); });
      return;
    }
    if (a === 'download') {
      var blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' });
      var link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'respaldo-sunset-fund-' + iso(new Date()) + '.json';
      document.body.appendChild(link); link.click(); link.remove(); return;
    }
    if (a === 'refresh') {
      var done = function () { location.reload(); };
      var p = [];
      if (window.caches) p.push(caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); }));
      if (navigator.serviceWorker) p.push(navigator.serviceWorker.getRegistrations().then(function (rs) { return Promise.all(rs.map(function (r) { return r.unregister(); })); }));
      Promise.all(p).then(done, done);
      return;
    }
    if (a === 'pastecode') {
      if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(function (t) { doImport(t); }, function () { ui.msg = 'Tu navegador no dejó leer el portapapeles. Pega el código en el cuadro de abajo.'; render(); });
      else { ui.msg = 'Pega el código en el cuadro de abajo.'; render(); }
      return;
    }
    if (a === 'import2') { doImport(document.getElementById('imp2').value); return; }
    if (a === 'more') { ui.more = !ui.more; return render(); }
    if (a === 'import') { doImport(document.getElementById('imp').value); return; }
    if (a === 'reset') {
      if (window.confirm('¿Borrar todos tus datos de esta app? No se puede deshacer.')) { S = L.defaults(); save(); ui.msg = 'Datos borrados.'; ui.prevFill = 0; render(); }
    }
  });
  function decodePlan(txt) {
    txt = String(txt || '').trim();
    var m = txt.match(/SF1:([A-Za-z0-9_\-+\/=]+)/) || txt.match(/#plan=([A-Za-z0-9_\-+\/=]+)/);
    if (m) {
      var b = m[1].replace(/-/g, '+').replace(/_/g, '/');
      while (b.length % 4) b += '=';
      txt = decodeURIComponent(escape(atob(b)));
    }
    return JSON.parse(txt);
  }
  function doImport(txt) {
    try {
      var o = decodePlan(txt);
      if (!o || typeof o !== 'object' || !('income' in o)) throw new Error('formato');
      S = merge(L.defaults(), o); save(); tab = 'hoy'; ui.msg = '';
      ui.toast = { text: 'Plan cargado', rain: '🌅' }; render(); window.scrollTo(0, 0);
    } catch (e) { ui.msg = 'No pude leer ese código. Cópialo completo y vuelve a intentar.'; render(); }
  }
  document.addEventListener('input', function (ev) {
    if (ev.target.id === 'q-amt') ui.amt = ev.target.value;
    if (ev.target.id === 'q-note') ui.note = ev.target.value;
    if (ev.target.id === 'q-date') ui.date = ev.target.value;
    if (ev.target.id === 'i-amt') ui.iamt = ev.target.value;
    if (ev.target.id === 'i-note') ui.inote = ev.target.value;
    if (ev.target.id === 'i-date') ui.idate = ev.target.value;
  });
  document.addEventListener('change', function (ev) {
    var el = ev.target;
    if (el.id === 'impfile' && el.files && el.files[0]) {
      var fr = new FileReader(); fr.onload = function () { doImport(fr.result); }; fr.readAsText(el.files[0]); return;
    }
    var p = el.dataset && el.dataset.f;
    if (!p) return;
    var t = el.dataset.t, val = el.value;
    if (t === 'number') val = val === '' ? 0 : parseFloat(val);
    else if (t === 'pct') val = val === '' ? null : parseFloat(val) / 100;
    if ((t === 'number' || t === 'pct') && val !== null && isNaN(val)) return;
    setPath(S, p, val); save(); render();
  });


  // ---------- pantalla de inicio ----------
  function startScreen() {
    var el = document.getElementById('start');
    if (!el) return;
    var li = L.levelInfo(L.xpTotal(S)), st = L.streak(S, new Date());
    el.innerHTML = '<div class="art">' + scene(1, false).replace('id="fillg"', '') + '</div>' +
      '<div><div class="logo">Sunset<span>Fund</span></div><div class="tag2">Ahorra de verdad. Sube de nivel.</div>' +
      '<div class="player"><span class="lv">' + li.level + '</span><span>' + LEVELS[Math.min(LEVELS.length - 1, li.level - 1)] + (st > 0 ? ' · 🔥 ' + st : '') + '</span></div></div>' +
      '<div><div class="press">Toca para empezar</div></div>';
    function go2() { el.classList.add('out'); setTimeout(function () { el.style.display = 'none'; }, 650); }
    el.addEventListener('click', go2);
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') go2(); });
  }

  if ('serviceWorker' in navigator) window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  if (location.hash.indexOf('#plan=') === 0) { try { var hp = decodePlan(location.hash); if (hp && 'income' in hp) { S = merge(L.defaults(), hp); save(); } } catch (e) {} history.replaceState(null, '', location.pathname); }
  render();
  startScreen();
})();
