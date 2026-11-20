/* Lógica pura del presupuesto: sin DOM, para poder probarla con Node. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Logic = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const WEEKS = 4.33;
  const ENV_KEYS = ['salidas', 'eventos', 'trabajo', 'gustos'];
  const ENV_NAMES = {
    salidas: 'Salidas',
    eventos: 'Eventos',
    trabajo: 'Trabajo',
    gustos: 'Gustos y metas de gusto',
    otro: 'Otro'
  };
  const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  function defaults() {
    return {
      version: 1,
      income: 0,
      extra: 0,
      payday: 15,
      funFloorWeekly: 600,
      savingPct: 10,
      fixed: [],
      trips: { count: 0, tolls: 0, gas: 0, food: 0 },
      installments: [],
      usdCard: { name: 'Tarjeta en dólares', balanceUSD: 0, apr: null, minUSD: null, fx: 18, monthlyMXN: 0 },
      goals: [],
      emergency: { months: 3, saved: 0 },
      openGoals: [],
      wishlist: [],
      upcoming: [],
      envelopes: {
        salidas: { pct: 50, times: 4 },
        eventos: { pct: 15, times: 1 },
        trabajo: { pct: 15, times: 2 },
        gustos: { pct: 20, times: 1 }
      },
      car: { name: 'Auto', price: 0, downPct: 20, apr: 0.14, months: 72 },
      wishSaved: 0,
      noSpend: [],
      deposits: [],
      cash: { amount: 0, asOf: '' },
      nextIncome: { date: '', amount: 0 },
      retirement: { monthly: 0, years: 25, realReturn: 3, current: 0 },
      expenses: []
    };
  }

  // ---------- fechas ----------
  function mIdx(d) { return d.getFullYear() * 12 + d.getMonth(); }
  function parseYM(s) { const p = String(s).split('-'); return +p[0] * 12 + (+p[1] - 1); }
  function parseDate(s) { const p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +(p[2] || 1)); }
  function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
  function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function paydayDate(idx, payday) {
    const y = Math.floor(idx / 12), m = idx % 12;
    return new Date(y, m, Math.min(payday, daysInMonth(y, m)));
  }
  function labelMonth(idx) { return MONTHS[idx % 12] + ' ' + String(Math.floor(idx / 12)).slice(2); }
  function firstPlanMonth(now, payday) {
    const today = startOfDay(now);
    let i = mIdx(now);
    while (paydayDate(i, payday) <= today) i++;
    return i;
  }
  function paydaysCount(fromIdx, deadline, payday) {
    let n = 0, i = fromIdx;
    while (paydayDate(i, payday) <= deadline && n < 600) { n++; i++; }
    return n;
  }
  // Ciclo de pago actual: del último día de pago al siguiente (el plan es el del mes en que termina).
  function cycle(now, payday) {
    const today = startOfDay(now);
    const thisIdx = mIdx(now);
    const endIdx = paydayDate(thisIdx, payday) <= today ? thisIdx + 1 : thisIdx;
    return { start: paydayDate(endIdx - 1, payday), end: paydayDate(endIdx, payday), planIdx: endIdx };
  }

  // ---------- cifras base ----------
  function tripsTotal(s) {
    const t = s.trips || {};
    return (+t.count || 0) * ((+t.tolls || 0) + (+t.gas || 0) + (+t.food || 0));
  }
  function inRange(x, idx) {
    if (idx === undefined) return true;
    const st = x.startMonth ? parseYM(x.startMonth) : -Infinity;
    const en = x.endMonth ? parseYM(x.endMonth) : Infinity;
    return idx >= st && idx <= en;
  }
  function fixedTotal(s, idx) {
    return (s.fixed || []).reduce((a, x) => a + (inRange(x, idx) ? (+x.amount || 0) : 0), 0) + tripsTotal(s);
  }
  function installmentsFor(s, idx) {
    return (s.installments || []).reduce((a, x) => {
      const st = x.startMonth ? parseYM(x.startMonth) : -Infinity;
      const en = x.endMonth ? parseYM(x.endMonth) : Infinity;
      return a + (idx >= st && idx <= en ? (+x.monthly || 0) : 0);
    }, 0);
  }
  function pmt(rate, n, pv) {
    if (!n) return 0;
    if (!rate) return pv / n;
    return pv * rate / (1 - Math.pow(1 + rate, -n));
  }
  // Meses para liquidar una deuda en dólares pagando payUSD al mes.
  function usdPayoff(balanceUSD, apr, payUSD) {
    let bal = balanceUSD, months = 0, interest = 0;
    if (!(bal > 0)) return { months: 0, interestUSD: 0 };
    if (!(payUSD > 0)) return { months: null, interestUSD: 0 };
    while (bal > 0.005 && months < 600) {
      const i = apr ? bal * apr / 12 : 0;
      if (payUSD <= i && apr) return { months: null, interestUSD: interest };
      interest += i;
      bal = bal + i - Math.min(payUSD, bal + i);
      months++;
    }
    return { months: bal > 0.005 ? null : months, interestUSD: interest };
  }

  // ---------- proyección mes a mes ----------
  function projection(s, now, months) {
    months = months || 36;
    const start = firstPlanMonth(now, s.payday || 15);
    const income = (+s.income || 0) + (+s.extra || 0);
    const u = s.usdCard || {};
    const fx = +u.fx || 18;
    const payUSD = (+u.monthlyMXN || 0) / fx;
    const apr = u.apr || 0;
    let bal = +u.balanceUSD || 0;
    const floor = (+s.funFloorWeekly || 0) * WEEKS;
    const saveTarget = (+s.savingPct || 0) / 100 * income;
    const dated = (s.goals || []).filter(g => g.deadline);
    const info = dated.map(g => {
      const dl = parseDate(g.deadline);
      const n = paydaysCount(start, dl, s.payday || 15);
      return { g, dl, n, c: n > 0 ? Math.max(0, (+g.target || 0) - (+g.saved || 0)) / n : 0 };
    });
    const rows = [];
    for (let k = 0; k < months; k++) {
      const idx = start + k;
      const fixed = fixedTotal(s, idx);
      const inst = installmentsFor(s, idx);
      let usdMXN = 0;
      if (bal > 0.005) {
        const owed = bal + bal * apr / 12;
        const pay = Math.min(payUSD, owed);
        bal = owed - pay;
        usdMXN = pay * fx;
      }
      let goalsC = 0;
      const goalLines = [];
      info.forEach(o => { if (k < o.n && o.c > 0) { goalsC += o.c; goalLines.push({ name: o.g.name, amount: o.c }); } });
      const mustPay = fixed + inst + usdMXN + goalsC;
      const R = income - mustPay;
      let fun = 0, saving = 0, extraFun = 0, extraSave = 0, shortfall = 0;
      if (R < 0) shortfall = -R;
      else {
        fun = Math.min(R, floor);
        const R2 = R - fun;
        saving = Math.min(R2, saveTarget);
        const extra = R2 - saving;
        extraFun = extra * 0.5;
        extraSave = extra - extraFun;
      }
      rows.push({
        idx, label: labelMonth(idx), income, fixed, inst, usdMXN, goalsC, goalLines, mustPay, R,
        floor, floorShort: Math.max(0, floor - Math.max(0, fun)) ,
        fun, saving, extraFun, extraSave, shortfall,
        funPool: fun + extraFun, savePool: saving + extraSave, usdBalUSD: bal
      });
    }
    return rows;
  }

  function envelopes(s, row) {
    const e = s.envelopes || {};
    const total = ENV_KEYS.reduce((a, k) => a + (+(e[k] || {}).pct || 0), 0) || 1;
    const out = {};
    ENV_KEYS.forEach(k => {
      const v = e[k] || { pct: 0, times: 1 };
      const amount = row.funPool * (+v.pct || 0) / total;
      const times = Math.max(1, +v.times || 1);
      out[k] = { amount, times, perTime: amount / times, pct: (+v.pct || 0) / total * 100 };
    });
    return out;
  }

  // ¿Cuándo alcanza para cada cosa? Colas secuenciales sobre un fondo mensual.
  function etaQueue(rows, items, field) {
    const out = [];
    let cumNeed = 0, cumPool = 0, r = -1;
    const pools = rows.map(x => { cumPool += field(x); return cumPool; });
    items.forEach(it => {
      cumNeed += Math.max(0, +it.need || 0);
      let found = null;
      for (let i = 0; i < pools.length; i++) { if (pools[i] >= cumNeed - 0.005) { found = rows[i].idx; break; } }
      out.push({ name: it.name, need: it.need, idx: found });
    });
    return out;
  }

  function spentByEnv(expenses, cyc) {
    const out = { salidas: 0, eventos: 0, trabajo: 0, gustos: 0, otro: 0 };
    const cnt = { salidas: 0, eventos: 0, trabajo: 0, gustos: 0, otro: 0 };
    (expenses || []).forEach(e => {
      const d = parseDate(e.date);
      if (d >= cyc.start && d < cyc.end) {
        const k = out[e.env] === undefined ? 'otro' : e.env;
        out[k] += +e.amount || 0;
        cnt[k]++;
      }
    });
    return { spent: out, count: cnt };
  }

  function carEval(car, income) {
    const price = +car.price || 0;
    const down = price * (+car.downPct || 0) / 100;
    const financed = price - down;
    const payment = pmt((+car.apr || 0) / 12, +car.months || 0, financed);
    return {
      price, down, financed, payment,
      share: income > 0 ? payment / income : null,
      incomeNeeded: payment / 0.2
    };
  }

  // Palancas para cerrar el hueco del mes (colchón sin culpa + obligaciones).
  function levers(s, row) {
    const gap = Math.max(0, row.floor - row.R);
    if (gap <= 0.5) return { gap: 0, list: [] };
    const list = [];
    list.push({ type: 'income', amount: gap });
    const u = s.usdCard || {};
    if ((+u.monthlyMXN || 0) > 0 && (+u.balanceUSD || 0) > 0) {
      const cut = Math.min(gap, +u.monthlyMXN);
      const fx = +u.fx || 18;
      const np = (+u.monthlyMXN - cut) / fx;
      const now = usdPayoff(+u.balanceUSD, u.apr || 0, (+u.monthlyMXN) / fx);
      const after = usdPayoff(+u.balanceUSD, u.apr || 0, np);
      list.push({ type: 'usd', cut, newPay: +u.monthlyMXN - cut, monthsNow: now.months, monthsAfter: after.months,
        interestExtraUSD: (after.interestUSD || 0) - (now.interestUSD || 0), hasApr: !!u.apr });
    }
    row.goalLines.forEach(gl => {
      const g = (s.goals || []).find(x => x.name === gl.name);
      if (!g) return;
      const n = Math.round(Math.max(0, (+g.target || 0) - (+g.saved || 0)) / gl.amount);
      if (n >= 1) list.push({ type: 'goal', name: g.name, save: gl.amount - gl.amount * n / (n + 1), months: n });
    });
    return { gap, list };
  }

  // Pagos próximos (Nu, tarjeta EUA...) contra el dinero disponible y el siguiente ingreso.
  function countdown(s, now) {
    const today = startOfDay(now);
    const fx = +((s.usdCard || {}).fx) || 18;
    const items = (s.upcoming || []).map(u => {
      const pending = Math.max(0, (+u.amount || 0) - (+u.paid || 0));
      const date = parseDate(u.date);
      return { id: u.id, name: u.name, date, pending, days: Math.round((date - today) / 86400000) };
    }).filter(u => u.pending > 0.5).sort((a, b) => a.date - b.date);
    const ni = s.nextIncome && s.nextIncome.date ? { date: parseDate(s.nextIncome.date), amount: +s.nextIncome.amount || 0 } : null;
    let need = 0;
    const cash = +((s.cash || {}).amount) || 0;
    items.forEach(it => {
      need += it.pending;
      const incomeBefore = ni && ni.date <= it.date ? ni.amount : 0;
      it.cumNeed = need;
      it.gap = Math.max(0, need - cash - incomeBefore);
      it.incomeBefore = incomeBefore;
    });
    return { items, cash, nextIncome: ni, fx };
  }

  function retirementFV(r) {
    const n = Math.round((+r.years || 0) * 12);
    const i = Math.pow(1 + (+r.realReturn || 0) / 100, 1 / 12) - 1;
    const pmtv = +r.monthly || 0, pv = +r.current || 0;
    const fv = i ? pv * Math.pow(1 + i, n) + pmtv * (Math.pow(1 + i, n) - 1) / i : pv + pmtv * n;
    return { fv, contributed: pv + pmtv * n, monthlyIncome4: fv * 0.04 / 12 };
  }

  function emergencyTarget(s, idx) {
    return (+((s.emergency || {}).months) || 0) * fixedTotal(s, idx);
  }

  // ---------- juego: rachas, XP y niveles (solo conductas reales) ----------
  function dayKey(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function streak(s, now) {
    const set = new Set((s.expenses || []).map(e => e.date).concat(s.noSpend || []));
    const d = startOfDay(now);
    if (!set.has(dayKey(d))) d.setDate(d.getDate() - 1);
    let n = 0;
    while (set.has(dayKey(d)) && n < 3650) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function bestStreak(s) {
    const days = Array.from(new Set((s.expenses || []).map(e => e.date).concat(s.noSpend || []))).sort();
    let best = 0, run = 0, prev = null;
    days.forEach(k => {
      const d = parseDate(k);
      if (prev && Math.round((d - prev) / 86400000) === 1) run++; else run = 1;
      if (run > best) best = run;
      prev = d;
    });
    return best;
  }
  function xpTotal(s) {
    const logs = (s.expenses || []).length * 5;
    const ns = (s.noSpend || []).length * 10;
    const dep = (s.deposits || []).reduce((a, x) => a + Math.min(50, Math.floor((+x.amount || 0) / 100)), 0);
    return logs + ns + dep;
  }
  function levelInfo(xp) {
    let level = 1, need = 50, rem = xp;
    while (rem >= need && level < 99) { rem -= need; level++; need = Math.round(need * 1.35); }
    return { level, into: rem, need };
  }
  function savedReal(s) {
    const sum = k => (s.deposits || []).filter(x => x.kind === k).reduce((a, x) => a + (+x.amount || 0), 0);
    return { ahorro: sum('meta') + sum('emergencia') + sum('ahorro'), deuda: sum('deuda') };
  }

  return {
    streak, bestStreak, xpTotal, levelInfo, savedReal, dayKey, countdown, retirementFV, emergencyTarget, WEEKS, ENV_KEYS, ENV_NAMES, defaults, mIdx, parseYM, parseDate, paydayDate, labelMonth, firstPlanMonth,
    paydaysCount, cycle, tripsTotal, fixedTotal, installmentsFor, pmt, usdPayoff, projection, envelopes,
    etaQueue, spentByEnv, carEval, levers
  };
});
