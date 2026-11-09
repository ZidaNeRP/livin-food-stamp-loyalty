/* Livin' Food Stamp prototype — screens, navigation, celebration, demo panel, merchant dashboard. */
(function () {
  'use strict';
  const { engine: E, data: D, services: S, sound: Sound } = window.LFS;
  const fmt = E.formatRp;
  const STORE_KEY = 'lfs-demo-v1';
  const CYCLE = E.RULES.CYCLE_SIZE;
  const STAMP_RP = fmt(E.RULES.STAMP_VALUE);
  const EXAMPLE_RP = fmt(E.RULES.STAMP_VALUE * 2 + 20000); // earns 2 stamps, Rp20.000 left over

  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const merchantById = (id) => D.merchants.find((m) => m.id === id);
  const itemById = (m, id) => m.menu.find((i) => i.id === id);
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmtDate = (ts) => new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtTime = (ts) => new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const fmtDateTime = (ts) => fmtDate(ts) + ', ' + new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const fmtNum = (n) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const fmtShort = (n) =>
    n >= 1e9 ? 'Rp ' + (n / 1e9).toFixed(2).replace('.', ',') + ' M' : n >= 1e6 ? 'Rp ' + (n / 1e6).toFixed(1).replace('.', ',') + ' jt' : fmt(n);

  /* ---------- Icons ---------- */
  const svg = (body) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  const I = {
    back: svg('<path d="M15 18l-6-6 6-6"/>'),
    chevron: svg('<path d="M9 18l6-6-6-6"/>'),
    close: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    minus: svg('<path d="M5 12h14"/>'),
    check: svg('<path d="M20 6 9 17l-5-5"/>'),
    cart: svg('<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2.5 3h2.6l2.4 12h11.2l2-8.5H6.3"/>'),
    ticket: svg('<path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4z"/><path d="M15 5v14" stroke-dasharray="2 2.4"/>'),
    home: svg('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>'),
    receipt: svg('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>'),
    star: svg('<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" fill="currentColor" stroke="none"/>'),
    clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    pin: svg('<path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
    info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
    gift: svg('<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12"/><path d="M12 8S10.5 3.5 8 4.5 9 8 12 8zM12 8s1.5-4.5 4-3.5S15 8 12 8z"/>'),
    bolt: svg('<path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="currentColor"/>'),
    wallet: svg('<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M16 14.5h2"/>'),
    reset: svg('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>'),
    download: svg('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
    phone: svg('<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>'),
    chart: svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
    signal: '<svg viewBox="0 0 18 12" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>',
    wifi: '<svg viewBox="0 0 16 12" aria-hidden="true"><path d="M8 2.2c2.5 0 4.8 1 6.5 2.6l1.2-1.3A11 11 0 0 0 8 .4 11 11 0 0 0 .3 3.5l1.2 1.3A9.2 9.2 0 0 1 8 2.2zm0 3.6c1.5 0 2.9.6 3.9 1.6l1.3-1.3A7.4 7.4 0 0 0 8 4a7.4 7.4 0 0 0-5.2 2.1l1.3 1.3c1-1 2.4-1.6 3.9-1.6zM8 9.4a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6z"/></svg>',
    battery: '<svg viewBox="0 0 27 12" aria-hidden="true"><rect x=".5" y=".5" width="23" height="11" rx="3" fill="none" stroke="currentColor" opacity=".45"/><rect x="2" y="2" width="18" height="8" rx="1.6"/><rect x="24.5" y="4" width="1.8" height="4" rx=".9" opacity=".45"/></svg>',
  };
  // Fork & spoon: the stamp glyph from the logo.
  const FORK =
    '<svg class="fork" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M5.5 3v5a2.5 2.5 0 0 0 5 0V3M8 3v5M8 10.5V21"/><ellipse cx="16.5" cy="7" rx="2.8" ry="4"/><path d="M16.5 11v10"/></svg>';
  // Rubber stamp, drawn after the one in the logo. Rubber bottom sits at y=96 of 100.
  const STAMPER = `<svg viewBox="0 0 80 100" width="80" height="100" aria-hidden="true">
    <defs><linearGradient id="stg" x1="0" x2="1"><stop offset="0" stop-color="#FFE07A"/><stop offset=".55" stop-color="#FFC72C"/><stop offset="1" stop-color="#E9A100"/></linearGradient></defs>
    <ellipse cx="40" cy="19" rx="17" ry="15.5" fill="url(#stg)" stroke="#0B2F7A" stroke-width="3"/>
    <ellipse cx="34" cy="13" rx="5.5" ry="3.5" fill="#fff" opacity=".7"/>
    <path d="M31 33h18l5 30H26z" fill="url(#stg)" stroke="#0B2F7A" stroke-width="3" stroke-linejoin="round"/>
    <rect x="11" y="61" width="58" height="16" rx="6" fill="url(#stg)" stroke="#0B2F7A" stroke-width="3"/>
    <rect x="8" y="76" width="64" height="20" rx="7" fill="#0B2F7A"/>
    <rect x="14" y="80" width="52" height="3" rx="1.5" fill="#fff" opacity=".18"/>
  </svg>`;

  /* ---------- State ---------- */
  function defaultState() {
    return {
      v: 1,
      view: 'app',
      route: { name: 'home' },
      sound: true,
      cards: { kfc: { stamps: 3, cycle: 1, lifetime: 3 }, mcd: { stamps: 1, cycle: 1, lifetime: 1 } },
      carts: { kfc: {}, mcd: {} },
      applied: { kfc: null, mcd: null },
      vouchers: [],
      orders: [],
      reconSubmitted: {},
      apiLog: [],
      demoMerchant: 'kfc',
      dashMerchant: 'kfc',
      dashFilter: 'all',
      voucherTab: 'active',
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && saved.v === 1) return Object.assign(defaultState(), saved);
      }
    } catch (e) {
      /* storage unavailable: start fresh */
    }
    return defaultState();
  }

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (e) {
      /* ignore */
    }
  }

  let state = load();
  const ui = { stack: [], sheet: null, busy: false, openLogs: new Set(), renderedKey: null };
  const cele = { active: false, skipped: false };

  /* ---------- Cart helpers ---------- */
  const feesFor = (m) => ({ delivery: m.deliveryFee, service: D.fees.service, payment: D.fees.payment });
  const activeVouchersFor = (m) => state.vouchers.filter((v) => v.merchantId === m.id && v.status === 'active');

  function appliedVoucher(m) {
    const id = state.applied[m.id];
    return (id && state.vouchers.find((v) => v.id === id && v.status === 'active')) || null;
  }

  function cartLines(m) {
    const cart = state.carts[m.id];
    const lines = Object.keys(cart)
      .map((id) => {
        const it = itemById(m, id);
        return it && cart[id] > 0 ? { id, name: it.name, emoji: it.emoji, price: it.price, qty: cart[id] } : null;
      })
      .filter(Boolean);
    const v = appliedVoucher(m);
    if (v && v.tier === E.TIER_FREE_MEAL) {
      lines.push({ id: m.id + '-reward', name: m.reward.name, emoji: '🎁', price: 0, retail: m.reward.retail, qty: 1, reward: true });
    }
    return lines;
  }

  function calcFor(m) {
    const lines = cartLines(m);
    const voucher = appliedVoucher(m);
    return { lines, voucher, calc: E.calculateOrder({ lines, fees: feesFor(m), voucher }) };
  }

  const cartCount = (m) => Object.values(state.carts[m.id]).reduce((s, q) => s + q, 0);

  function setQty(m, itemId, qty) {
    const cart = state.carts[m.id];
    if (qty <= 0) delete cart[itemId];
    else cart[itemId] = qty;
  }

  const unlockName = (m, tier) => (tier === E.TIER_DISC50 ? 'Voucher Diskon 50%' : m.reward.name + ' GRATIS');

  function nextMilestoneText(m, stamps) {
    if (stamps >= CYCLE) return 'Kartu penuh!';
    if (stamps < 5) return `${5 - stamps} stamp lagi menuju Voucher Diskon 50%`;
    return `${CYCLE - stamps} stamp lagi menuju ${m.reward.name} GRATIS`;
  }

  /* ---------- Shared components ---------- */
  const mBadge = (m) => `<span class="mbadge" style="--mc:${m.color}">${esc(m.short)}</span>`;

  function stampCardHTML(m, card) {
    let slots = '';
    for (let i = 1; i <= CYCLE; i++) {
      const filled = i <= card.stamps;
      const ms = E.RULES.MILESTONES[i];
      const cls = ['slot', filled ? 'filled' : '', ms ? 'ms' : ''].join(' ');
      let inner = FORK;
      if (!filled) inner = ms === E.TIER_DISC50 ? '<b>50%</b>' : ms ? I.gift : `<span>${i}</span>`;
      slots += `<div class="${cls}" data-slot="${i}">${inner}</div>`;
    }
    return `<div class="stampcard">
      <div class="sc-head">
        <img class="sc-wordmark" src="assets/livin-wordmark.png" alt="livin'">
        <div class="sc-right">${card.cycle > 1 ? `<span class="sc-cycle">Kartu ke-${card.cycle}</span>` : ''}${mBadge(m)}</div>
      </div>
      <div class="sc-grid">${slots}</div>
      <div class="sc-legend"><span><i class="lg y"></i>5 = Diskon 50%</span><span><i class="lg y"></i>10 = ${esc(m.reward.name)} gratis</span></div>
    </div>`;
  }

  function dotsHTML(filled, pending) {
    let h = '<div class="dots">';
    for (let i = 1; i <= CYCLE; i++) {
      const cls = i <= filled ? 'f' : i <= filled + pending ? 'p' : '';
      h += `<i class="${cls}${E.RULES.MILESTONES[i] ? ' ms' : ''}"></i>`;
    }
    return h + '</div>';
  }

  function stepper(mid, iid, q) {
    return `<div class="stepper">
      <button data-action="dec" data-merchant="${mid}" data-item="${iid}" aria-label="Kurangi">${I.minus}</button>
      <span>${q}</span>
      <button data-action="add" data-merchant="${mid}" data-item="${iid}" aria-label="Tambah">${I.plus}</button>
    </div>`;
  }

  function tabbar(active) {
    const t = (id, icon, label) =>
      `<button class="tb ${active === id ? 'on' : ''}" data-action="tab" data-tab="${id}" ${active === id ? 'aria-current="page"' : ''}>${icon}<span>${label}</span></button>`;
    return `<nav class="tabbar">${t('home', I.home, 'Beranda')}${t('vouchers', I.ticket, 'Voucher Saya')}${t('history', I.receipt, 'Riwayat')}</nav>`;
  }

  function appbar(title, opts = {}) {
    const left = opts.back
      ? `<button class="icon-btn" data-action="back" aria-label="Kembali">${I.back}</button>`
      : `<button class="icon-btn" data-action="toast" data-msg="Di aplikasi asli, ini kembali ke beranda Livin'" aria-label="Kembali">${I.back}</button>`;
    return `<header class="appbar ${opts.blue ? 'blue' : ''}">
      <div class="ab-row">${left}<h1 class="ab-title">${title}</h1>${opts.right || '<span class="icon-btn" aria-hidden="true"></span>'}</div>
      ${opts.extra || ''}
    </header>`;
  }

  /* ---------- Screens ---------- */
  function screenHome() {
    const active = state.vouchers.filter((v) => v.status === 'active').length;
    const right = `<button class="icon-btn" data-action="tab" data-tab="vouchers" aria-label="Voucher Saya">${I.ticket}${active ? `<span class="dot-badge">${active}</span>` : ''}</button>`;
    const extra = `<div class="ab-addr">${I.pin}<span>Antar ke <b>Kantor · Jl. Gatot Subroto</b></span></div>`;
    const mini = (m) => {
      const c = state.cards[m.id];
      return `<button class="minicard" data-action="go" data-route="merchant" data-merchant="${m.id}">
        <div class="mc-top">${mBadge(m)}<span class="mc-count"><b>${c.stamps}</b>/10</span></div>
        ${dotsHTML(c.stamps, 0)}
        <div class="mc-next">${nextMilestoneText(m, c.stamps)}</div>
      </button>`;
    };
    const row = (m) => {
      const c = state.cards[m.id];
      return `<button class="mrow" data-action="go" data-route="merchant" data-merchant="${m.id}">
        <div class="mrow-img" style="--mc:${m.color}">${m.emoji}</div>
        <div class="mrow-body">
          <div class="mrow-name">${esc(m.branch)}</div>
          <div class="mrow-meta"><span class="rating">${I.star}${m.rating}</span> · ${m.eta} · ${m.distance}</div>
          <span class="tag-stamp">${FORK}Food Stamp · ${c.stamps}/10</span>
        </div>
        ${I.chevron}
      </button>`;
    };
    return `${appbar("Livin' Food", { blue: true, right, extra })}
    <div class="scroll">
      <section class="hero">
        <img src="assets/logo.png" alt="Livin' Food Stamp Loyalty by Mandiri">
        <p>Belanja <b>${STAMP_RP} = 1 stamp</b>. Stamp ke-5 dapat diskon 50%, stamp ke-10 makan gratis.</p>
        <button class="link-btn" data-action="sheet" data-sheet="rules">Cara kerja ${I.chevron}</button>
      </section>
      <h2 class="sec-title">Kartu Stamp Kamu</h2>
      <div class="hscroll">${D.merchants.map(mini).join('')}</div>
      <h2 class="sec-title">Merchant Food Stamp</h2>
      <div class="mlist">${D.merchants.map(row).join('')}</div>
    </div>
    ${tabbar('home')}`;
  }

  function screenMerchant(m) {
    const c = state.cards[m.id];
    const count = cartCount(m);
    const { calc } = calcFor(m);
    const vs = activeVouchersFor(m);
    const right = `<button class="icon-btn" data-action="go" data-route="cart" data-merchant="${m.id}" aria-label="Keranjang">${I.cart}${count ? `<span class="dot-badge">${count}</span>` : ''}</button>`;
    const item = (it) => {
      const q = state.carts[m.id][it.id] || 0;
      return `<div class="mi">
        <div class="mi-img">${it.emoji}</div>
        <div class="mi-body">
          <div class="mi-name">${esc(it.name)}${it.best ? '<span class="pill">Terlaris</span>' : ''}</div>
          <div class="mi-desc">${esc(it.desc)}</div>
          <div class="mi-price">${fmt(it.price)}</div>
        </div>
        ${q ? stepper(m.id, it.id, q) : `<button class="add-btn" data-action="add" data-merchant="${m.id}" data-item="${it.id}" aria-label="Tambah ${esc(it.name)}">${I.plus}</button>`}
      </div>`;
    };
    let cartbar = '';
    if (count) {
      const ok = calc.stamps_earned > 0;
      const hint = ok
        ? `Pesanan ini dapat <b>${calc.stamps_earned} Stamp</b>`
        : `Tambah <b>${fmt(calc.gap_to_next_stamp)}</b> lagi untuk dapat 1 Stamp`;
      cartbar = `<div class="cartbar-wrap">
        <div class="cb-hint ${ok ? 'ok' : 'warn'}">${FORK}<span>${hint}</span></div>
        <button class="cartbar" data-action="go" data-route="cart" data-merchant="${m.id}">
          <span class="cb-left"><span>${count} item</span><b>${fmt(calc.items_subtotal - calc.discount)}</b></span>
          <span class="cb-go">Lihat Keranjang ${I.chevron}</span>
        </button>
      </div>`;
    }
    return `${appbar(esc(m.name), { back: true, right })}
    <div class="scroll">
      <button class="promo-float" data-action="sheet" data-sheet="rules">${I.gift}<span>Kumpulkan 10 Stamp, Nikmati 1 ${esc(m.reward.name)} Gratis!</span>${I.chevron}</button>
      <section class="m-head">
        <div class="m-logo" style="--mc:${m.color}">${esc(m.short)}</div>
        <div>
          <div class="m-name">${esc(m.branch)}</div>
          <div class="m-meta"><span class="rating">${I.star}${m.rating}</span> · ${m.eta} · ${m.distance}</div>
        </div>
      </section>
      <section class="stamp-section">
        ${stampCardHTML(m, c)}
        <div class="sc-progress"><b>${c.stamps}/10 Stamp</b><span>${nextMilestoneText(m, c.stamps)}</span></div>
        <div class="sc-rule">${I.info}<span>1 stamp tiap ${STAMP_RP} subtotal makanan dalam satu transaksi.</span><button class="link-btn" data-action="sheet" data-sheet="rules">Detail</button></div>
        ${vs.length ? `<button class="voucher-hint" data-action="tab" data-tab="vouchers">${I.ticket}<span>Kamu punya <b>${vs.length} voucher</b> di ${esc(m.name)}</span>${I.chevron}</button>` : ''}
      </section>
      <nav class="cat-chips">${m.categories.map((cat) => `<button class="chip" data-action="scroll-cat" data-cat="${slug(cat)}">${cat}</button>`).join('')}</nav>
      ${m.categories
        .map((cat) => `<section class="menu-sec" id="cat-${slug(cat)}"><h3>${cat}</h3>${m.menu.filter((i) => i.cat === cat).map(item).join('')}</section>`)
        .join('')}
      <div class="spacer ${count ? 'tall' : ''}"></div>
    </div>
    ${cartbar}`;
  }

  function stampBoxHTML(m, c, calc, lines, voucher) {
    const nudge = E.buildNudge(calc, c);
    const earned = calc.stamps_earned;
    const within = calc.stamp_basis % E.RULES.STAMP_VALUE;
    const pct = Math.round((within / E.RULES.STAMP_VALUE) * 100);
    const after = c.stamps + earned;
    let body;
    if (nudge.strong) {
      const target = earned === 0 ? `1 Stamp ${esc(m.name)}` : `${nudge.nextTotal} Stamp ${esc(m.name)} sekaligus`;
      const quick = E.rankQuickAdds(m.menu.filter((i) => i.quick), lines, feesFor(m), voucher).slice(0, 4);
      body = `<div class="nudge" role="status">
          <div class="nudge-text">${I.bolt}<span><b>Tanggung banget!</b> Tambah belanja ${fmt(nudge.gap)} lagi untuk dapat ${target}.</span></div>
          ${nudge.unlocks ? `<div class="nudge-unlock">${I.gift}<span>Stamp ini membuka <b>${unlockName(m, nudge.unlocks)}</b>!</span></div>` : ''}
        </div>
        <div class="quick-row" aria-label="Tambah cepat">
          ${quick
            .map(
              ({ item, earnsStamp }) => `<button class="qa ${earnsStamp ? 'fit' : ''}" data-action="add" data-merchant="${m.id}" data-item="${item.id}" data-quick="1">
              <span class="qa-emoji">${item.emoji}</span>
              <span class="qa-name">${esc(item.name)}</span>
              <span class="qa-price">+${fmt(item.price)}</span>
              ${earnsStamp ? `<span class="qa-fit">${I.check}Dapat stamp</span>` : '<span class="qa-fit muted">Belum cukup</span>'}
            </button>`
            )
            .join('')}
        </div>`;
    } else {
      body = `<div class="sb-info">${I.info}<span>Belanja ${fmt(nudge.gap)} lagi untuk ${earned ? 'stamp berikutnya' : 'dapat 1 Stamp'}.</span></div>`;
    }
    return `<section class="card stampbox">
      <div class="sb-head">
        <div class="sb-title">${FORK}<span>Food Stamp ${esc(m.name)}</span></div>
        <span class="sb-earn ${earned ? 'on' : ''}">${earned ? `+${earned} Stamp` : 'Belum dapat stamp'}</span>
      </div>
      <div class="sb-dots">${dotsHTML(c.stamps, earned)}
        <span>${c.stamps}/10 → <b>${Math.min(after, CYCLE)}/10</b>${after > CYCLE ? ` + ${after - CYCLE} di kartu baru` : ''}</span>
      </div>
      <div class="sb-bar"><div class="bar"><i style="width:${pct}%"></i></div><span>${fmt(within)} / ${fmt(E.RULES.STAMP_VALUE)}</span></div>
      ${body}
      <p class="sb-basis">Dihitung dari subtotal makanan${calc.discount ? ' setelah diskon' : ''}: <b>${fmt(calc.stamp_basis)}</b>. Ongkir, biaya layanan &amp; biaya transaksi tidak dihitung.${calc.remainder_forfeited ? ` Sisa ${fmt(calc.remainder_forfeited)} tidak diakumulasi ke transaksi berikutnya.` : ''}</p>
    </section>`;
  }

  function screenCart(m) {
    const { lines, voucher, calc } = calcFor(m);
    const c = state.cards[m.id];
    const head = appbar('Keranjang', { back: true });
    if (!lines.length) {
      return `${head}<div class="scroll"><div class="empty">
        <div class="empty-emoji">🛒</div><h3>Keranjang masih kosong</h3>
        <p>Yuk pilih menu di ${esc(m.name)}. Tiap ${STAMP_RP} subtotal makanan = 1 stamp.</p>
        <button class="btn primary" data-action="back">Lihat menu</button>
      </div></div>`;
    }
    const line = (l) =>
      l.reward
        ? `<div class="cl reward"><div class="cl-img">🎁</div><div class="cl-body"><div class="cl-name">${esc(l.name)}</div><div class="cl-sub">Reward Food Stamp</div></div><div class="cl-price"><s>${fmt(l.retail)}</s><b>GRATIS</b></div></div>`
        : `<div class="cl"><div class="cl-img">${l.emoji}</div><div class="cl-body"><div class="cl-name">${esc(l.name)}</div><div class="cl-sub">${fmt(l.price)}</div></div>${stepper(m.id, l.id, l.qty)}</div>`;
    const avail = activeVouchersFor(m);
    const vrow = voucher
      ? `<section class="card vrow applied">${I.ticket}<div><b>${esc(voucher.title)}</b><span>Voucher Food Stamp terpasang</span></div><button class="link-btn" data-action="unapply" data-merchant="${m.id}">Hapus</button></section>`
      : `<button class="card vrow" data-action="sheet" data-sheet="vouchers" ${avail.length ? '' : 'disabled'}>${I.ticket}<div><b>${avail.length ? `${avail.length} voucher bisa dipakai` : 'Belum ada voucher'}</b><span>${avail.length ? 'Pakai voucher Food Stamp' : 'Kumpulkan 5 stamp untuk voucher diskon 50%'}</span></div>${avail.length ? I.chevron : ''}</button>`;
    const row = (label, value, cls = '') => `<div class="sum-row ${cls}"><span>${label}</span><span>${value}</span></div>`;
    return `${head}
    <div class="scroll">
      <section class="card addr-card">${I.pin}<div><b>Kantor</b><span>Jl. Gatot Subroto Kav. 36–38, Jakarta</span></div><span class="eta">${m.eta}</span></section>
      <section class="card">
        <div class="card-title">${mBadge(m)}${esc(m.branch)}</div>
        ${lines.map(line).join('')}
        <button class="link-btn add-more" data-action="back">${I.plus}Tambah menu lain</button>
      </section>
      ${stampBoxHTML(m, c, calc, lines, voucher)}
      ${vrow}
      <section class="card summary">
        <div class="card-title">Rincian pembayaran</div>
        ${row('Subtotal makanan', fmt(calc.items_subtotal))}
        ${calc.discount ? row('Diskon voucher Food Stamp', '-' + fmt(calc.discount), 'disc') : ''}
        ${row('Ongkos kirim', fmt(calc.delivery_fee))}
        ${row('Biaya layanan', fmt(calc.service_fee))}
        ${row('Biaya transaksi', fmt(calc.payment_fee))}
        <div class="sum-total"><span>Total</span><b>${fmt(calc.total)}</b></div>
      </section>
      <section class="card pay-method">${I.wallet}<div><b>Livin' by Mandiri</b><span>${D.user.account}</span></div><span class="ok-chip">${I.check}</span></section>
      <div class="spacer tall"></div>
    </div>
    <div class="paybar">
      <div class="pb-total"><span>Total bayar</span><b>${fmt(calc.total)}</b></div>
      <button class="btn primary" data-action="pay" data-merchant="${m.id}">Bayar</button>
    </div>`;
  }

  function voucherCardHTML(v) {
    const m = merchantById(v.merchantId);
    const is50 = v.tier === E.TIER_DISC50;
    const meta = v.status === 'active' ? `Berlaku s.d. ${fmtDate(v.expiresAt)}` : `Dipakai ${fmtDate(v.usedAt)}`;
    return `<div class="vcard ${is50 ? 'v50' : 'vfm'} ${v.status}">
      <div class="vc-stub"><b>${is50 ? '50%' : 'GRATIS'}</b><span>${is50 ? 'maks. 30rb' : 'Free Meal'}</span></div>
      <div class="vc-body">
        <div class="vc-merchant">${mBadge(m)}${esc(m.name)} · Stamp ke-${is50 ? 5 : 10}</div>
        <div class="vc-title">${esc(v.title)}</div>
        <div class="vc-foot"><span>${meta}</span>${
          v.status === 'active'
            ? `<button class="btn sm primary" data-action="use-voucher" data-voucher="${v.id}">Pakai</button>`
            : '<span class="used-chip">Terpakai</span>'
        }</div>
      </div>
    </div>`;
  }

  function screenVouchers() {
    const tab = state.voucherTab;
    const nA = state.vouchers.filter((v) => v.status === 'active').length;
    const nU = state.vouchers.length - nA;
    const list = state.vouchers.filter((v) => (tab === 'active' ? v.status === 'active' : v.status === 'used'));
    const empty =
      tab === 'active'
        ? `<div class="empty"><img src="assets/logo-mark.png" alt="" class="empty-img"><h3>Belum ada voucher aktif</h3><p>Kumpulkan 5 stamp di satu merchant untuk voucher diskon 50%, dan 10 stamp untuk makan gratis.</p><button class="btn primary" data-action="tab" data-tab="home">Mulai kumpulkan</button></div>`
        : `<div class="empty"><div class="empty-emoji">🎟️</div><h3>Belum ada voucher terpakai</h3></div>`;
    return `${appbar('Voucher Saya', { blue: true })}
    <div class="seg-tabs">
      <button class="${tab === 'active' ? 'on' : ''}" data-action="voucher-tab" data-tab="active">Aktif (${nA})</button>
      <button class="${tab === 'used' ? 'on' : ''}" data-action="voucher-tab" data-tab="used">Terpakai (${nU})</button>
    </div>
    <div class="scroll pad">${list.length ? list.map(voucherCardHTML).join('') : empty}</div>
    ${tabbar('vouchers')}`;
  }

  function screenHistory() {
    const order = (o) => {
      const m = merchantById(o.merchantId);
      return `<div class="card order">
        <div class="o-head">${mBadge(m)}<b>${esc(m.branch)}</b><span>${fmtDateTime(o.at)}</span></div>
        <div class="sum-row"><span>Subtotal makanan</span><span>${fmt(o.items_subtotal)}</span></div>
        ${o.discount ? `<div class="sum-row disc"><span>Diskon voucher</span><span>-${fmt(o.discount)}</span></div>` : ''}
        <div class="sum-row"><span>Total bayar</span><b>${fmt(o.total)}</b></div>
        <div class="o-stamp ${o.stamps_earned ? 'on' : ''}">${FORK}<span>${o.stamps_earned ? `+${o.stamps_earned} Stamp` : 'Tanpa stamp'}${o.remainder_forfeited ? ` · sisa ${fmt(o.remainder_forfeited)} tidak diakumulasi` : ''}</span></div>
      </div>`;
    };
    return `${appbar('Riwayat Pesanan', { blue: true })}
    <div class="scroll pad">${
      state.orders.length
        ? state.orders.map(order).join('')
        : `<div class="empty"><div class="empty-emoji">🧾</div><h3>Belum ada pesanan</h3><p>Pesan di KFC atau McDonald's untuk melihat stamp dicap ke kartumu.</p><button class="btn primary" data-action="tab" data-tab="home">Pesan sekarang</button></div>`
    }</div>
    ${tabbar('history')}`;
  }

  /* ---------- Bottom sheets ---------- */
  function sheetHTML() {
    if (!ui.sheet) return '';
    const m = merchantById(state.route.merchantId || 'kfc');
    let inner = '';
    if (ui.sheet === 'rules') {
      inner = `<h3>Cara kerja Food Stamp</h3>
        <ol class="rules">
          <li><span class="r-ico">${FORK}</span><div><b>${STAMP_RP} = 1 stamp</b><p>Berlaku kelipatan dalam satu transaksi. Belanja ${EXAMPLE_RP} = 2 stamp.</p></div></li>
          <li><span class="r-ico">${I.receipt}</span><div><b>Hanya subtotal makanan</b><p>Ongkos kirim, biaya layanan, biaya transaksi, dan potongan voucher tidak dihitung.</p></div></li>
          <li><span class="r-ico warn">${I.info}</span><div><b>Sisa tidak diakumulasi</b><p>Dari ${EXAMPLE_RP}, sisa ${fmt(20000)} hangus dan tidak dibawa ke transaksi berikutnya.</p></div></li>
          <li><span class="r-ico y"><b>50%</b></span><div><b>Stamp ke-5</b><p>Otomatis dapat Voucher Diskon 50% (maks. Rp30.000) untuk pesanan berikutnya.</p></div></li>
          <li><span class="r-ico y">${I.gift}</span><div><b>Stamp ke-10</b><p>Otomatis dapat e-Voucher 1x Free Meal: ${esc(m.reward.name)}. Lalu kartu baru dimulai.</p></div></li>
        </ol>
        <p class="fine">Stamp dan voucher berlaku per merchant. Voucher berlaku ${E.RULES.VOUCHER_VALID_DAYS} hari.</p>
        <button class="btn primary block" data-action="close-sheet">Mengerti</button>`;
    } else if (ui.sheet === 'vouchers') {
      const vs = activeVouchersFor(m);
      inner = `<h3>Pilih voucher ${esc(m.name)}</h3>
        <div class="vpick">${vs
          .map(
            (v) => `<button class="vpick-item" data-action="apply" data-voucher="${v.id}">
              <span class="vp-stub ${v.tier === E.TIER_DISC50 ? 'v50' : 'vfm'}">${v.tier === E.TIER_DISC50 ? '50%' : 'FREE'}</span>
              <span><b>${esc(v.title)}</b><small>Berlaku s.d. ${fmtDate(v.expiresAt)}</small></span>${I.chevron}
            </button>`
          )
          .join('')}</div>
        <button class="btn ghost block" data-action="close-sheet">Tidak pakai voucher</button>`;
    }
    return `<div class="sheet-backdrop" data-action="close-sheet"></div>
      <div class="sheet" role="dialog" aria-modal="true"><div class="sheet-grip"></div>${inner}</div>`;
  }

  /* ---------- Merchant dashboard ---------- */
  function seedRows(m) {
    let seed = m.id === 'kfc' ? 7 : 13;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const code = () => Math.floor(rnd() * 36 ** 6).toString(36).toUpperCase().padStart(6, '0');
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const rows = [];
    for (let i = 0; i < 16; i++) {
      const is50 = rnd() < 0.62;
      const at = today.getTime() - Math.floor((i * 1.9 + 0.4) * 86400000 + rnd() * 30000000);
      const cost = is50 ? (rnd() < 0.7 ? 30000 : Math.round((14000 + rnd() * 16000) / 500) * 500) : m.reward.hpp;
      rows.push({
        id: `S-${m.id}-${i}`,
        at,
        voucherId: (is50 ? 'V50-' : 'VFM-') + code(),
        customer: '•••• ' + (1000 + Math.floor(rnd() * 8999)),
        tier: is50 ? E.TIER_DISC50 : E.TIER_FREE_MEAL,
        orderId: 'ORD-' + code(),
        cost,
        status: i > 6 ? 'done' : 'pending',
        demo: false,
      });
    }
    return rows;
  }

  function dashRows(m) {
    const live = state.vouchers
      .filter((v) => v.merchantId === m.id && v.status === 'used')
      .map((v) => ({ id: v.id, at: v.usedAt, voucherId: v.id, customer: '•••• 4821', tier: v.tier, orderId: v.orderId, cost: v.cost, status: v.recon, demo: true }));
    const submitted = state.reconSubmitted[m.id] || [];
    const seeds = seedRows(m).map((r) => (r.status === 'pending' && submitted.includes(r.id) ? Object.assign({}, r, { status: 'submitted' }) : r));
    return live.concat(seeds).sort((a, b) => b.at - a.at);
  }

  const STATUS = { pending: ['Menunggu', 'st-wait'], submitted: ['Diajukan', 'st-sub'], done: ['Sudah direkonsiliasi', 'st-done'] };

  function renderDash() {
    const m = merchantById(state.dashMerchant);
    const h = D.history[m.id];
    const orders = state.orders.filter((o) => o.merchantId === m.id);
    const vs = state.vouchers.filter((v) => v.merchantId === m.id);
    const used = vs.filter((v) => v.status === 'used');
    const gmv = h.gmv + orders.reduce((s, o) => s + o.items_subtotal - o.discount, 0);
    const stamps = h.stamps + orders.reduce((s, o) => s + o.stamps_earned, 0);
    const i50 = h.disc50Issued + vs.filter((v) => v.tier === E.TIER_DISC50).length;
    const r50 = h.disc50Redeemed + used.filter((v) => v.tier === E.TIER_DISC50).length;
    const iFM = h.freeMealIssued + vs.filter((v) => v.tier === E.TIER_FREE_MEAL).length;
    const rFM = h.freeMealRedeemed + used.filter((v) => v.tier === E.TIER_FREE_MEAL).length;
    const cost = h.disc50Redeemed * h.avgDisc + h.freeMealRedeemed * m.reward.hpp + used.reduce((s, v) => s + v.cost, 0);
    const ratio = ((cost / gmv) * 100).toFixed(1).replace('.', ',');

    const all = dashRows(m);
    const rows = all.filter((r) => state.dashFilter === 'all' || r.tier === state.dashFilter);
    const pending = all.filter((r) => r.status === 'pending');
    const pendingSum = pending.reduce((s, r) => s + r.cost, 0);

    const cycleGmv = E.RULES.STAMP_VALUE * CYCLE;
    const cycleCost = E.RULES.DISCOUNT_CAP + m.reward.hpp;
    const cyclePct = ((cycleCost / cycleGmv) * 100).toFixed(1).replace('.', ',');

    const kpi = (label, value, sub) => `<div class="kpi"><span>${label}</span><b>${value}</b><small>${sub}</small></div>`;
    const chip = (id, label) => `<button class="chip ${state.dashFilter === id ? 'on' : ''}" data-action="dash-filter" data-filter="${id}">${label}</button>`;

    $('#dash').innerHTML = `
      <div class="d-top">
        <div>
          <div class="d-brand"><img src="assets/livin-wordmark.png" alt="livin'"><span>Merchant Dashboard</span></div>
          <h2>Klaim Reward Loyalty</h2>
          <p>Rekap reward Food Stamp yang sudah di-redeem nasabah, untuk rekonsiliasi tagihan co-funding.</p>
        </div>
        <div class="seg">${D.merchants
          .map((x) => `<button class="${x.id === m.id ? 'on' : ''}" data-action="dash-merchant" data-merchant="${x.id}">${esc(x.name)}</button>`)
          .join('')}</div>
      </div>
      <div class="kpis">
        ${kpi('GMV makanan dari program', fmtShort(gmv), `${fmtNum(stamps)} stamp diterbitkan`)}
        ${kpi('Voucher 50% di-redeem', fmtNum(r50), `dari ${fmtNum(i50)} diterbitkan`)}
        ${kpi('Free Meal di-redeem', fmtNum(rFM), `dari ${fmtNum(iFM)} diterbitkan`)}
        ${kpi('Beban reward (100% merchant)', fmtShort(cost), `${ratio}% dari GMV program`)}
      </div>
      <div class="d-grid">
        <section class="dcard">
          <div class="d-tablehead">
            <h3>Reward yang di-redeem</h3>
            <div class="chips">${chip('all', 'Semua')}${chip(E.TIER_DISC50, 'Voucher 50%')}${chip(E.TIER_FREE_MEAL, 'Free Meal')}</div>
            <button class="btn sm ghost" data-action="export-csv">${I.download}Ekspor CSV</button>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Tanggal</th><th>ID Voucher</th><th>Nasabah</th><th>Reward</th><th>Order</th><th class="num">Beban merchant</th><th>Status</th></tr></thead>
              <tbody>${rows
                .map(
                  (r) => `<tr class="${r.demo ? 'live' : ''}">
                    <td>${fmtDate(r.at)}${r.demo ? '<span class="live-pill">Demo</span>' : ''}</td>
                    <td><code>${esc(r.voucherId)}</code></td>
                    <td>${r.customer}</td>
                    <td><span class="rw ${r.tier === E.TIER_DISC50 ? 'v50' : 'vfm'}">${r.tier === E.TIER_DISC50 ? 'Diskon 50%' : 'Free Meal'}</span></td>
                    <td><code>${esc(r.orderId)}</code></td>
                    <td class="num">${fmt(r.cost)}</td>
                    <td><span class="st ${STATUS[r.status][1]}">${STATUS[r.status][0]}</span></td>
                  </tr>`
                )
                .join('')}</tbody>
            </table>
          </div>
          <div class="d-foot">
            <span>Menunggu rekonsiliasi: <b>${pending.length} klaim · ${fmt(pendingSum)}</b></span>
            <button class="btn sm primary" data-action="submit-recon" ${pending.length ? '' : 'disabled'}>Ajukan rekonsiliasi</button>
          </div>
        </section>
        <section class="dcard econ">
          <div>
            <h3>Unit ekonomi per 10 stamp</h3>
            <p>Merchant sudah mengantongi GMV makanan minimal <b>${fmt(cycleGmv)}</b> dari satu nasabah sebelum Free Meal bisa diklaim.</p>
            <div class="econ-bar" role="img" aria-label="Beban reward ${cyclePct}% dari GMV per siklus">
              <i class="gmv" style="flex:${cycleGmv - cycleCost}"></i><i class="v50" style="flex:${E.RULES.DISCOUNT_CAP}"></i><i class="fm" style="flex:${m.reward.hpp}"></i>
            </div>
            <p class="fine">Angka historis adalah data contoh. Baris berlabel “Demo” berasal dari transaksi di prototipe ini.</p>
          </div>
          <dl class="econ-list">
            <div><dt><i class="sw gmv"></i>GMV makanan minimal</dt><dd>${fmt(cycleGmv)}</dd></div>
            <div><dt><i class="sw v50"></i>Voucher 50% (maks.)</dt><dd>${fmt(E.RULES.DISCOUNT_CAP)}</dd></div>
            <div><dt><i class="sw fm"></i>Free Meal (HPP est.)</dt><dd>${fmt(m.reward.hpp)}</dd></div>
            <div class="tot"><dt>Beban reward maks.</dt><dd>${fmt(cycleCost)} · ${cyclePct}%</dd></div>
          </dl>
        </section>
      </div>`;
  }

  function exportCsv() {
    const m = merchantById(state.dashMerchant);
    const rows = dashRows(m);
    const head = ['tanggal', 'voucher_id', 'nasabah', 'reward', 'order_id', 'beban_merchant', 'status'];
    const lines = rows.map((r) =>
      [new Date(r.at).toISOString(), r.voucherId, r.customer, r.tier, r.orderId, r.cost, r.status].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')
    );
    const blob = new Blob([head.join(',') + '\n' + lines.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `klaim-reward-loyalty-${m.id}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  /* ---------- Demo panel ---------- */
  function renderPanel() {
    const dm = merchantById(state.demoMerchant);
    const c = state.cards[dm.id];
    const cartTotal = (kind) => {
      const cart = D.demoCarts[dm.id][kind];
      return Object.keys(cart).reduce((s, id) => s + itemById(dm, id).price * cart[id], 0);
    };
    const log = (e) => `<details class="log-item" data-log="${e.id}" ${ui.openLogs.has(e.id) ? 'open' : ''}>
        <summary><span class="lm lm-${e.method.toLowerCase()}">${e.method}</span><code>${esc(e.path)}</code><time>${fmtTime(e.at)}</time></summary>
        <pre>${esc(JSON.stringify({ request: e.body, response: e.response }, null, 2))}</pre>
      </details>`;
    $('#panel').innerHTML = `
      <div class="p-head"><img src="assets/logo-mark.png" alt=""><div><b>Panel Demo</b><span>Prototipe konsep · data contoh · bukan aplikasi resmi Bank Mandiri</span></div></div>
      <div class="seg full" aria-label="Tampilan">
        <button class="${state.view === 'app' ? 'on' : ''}" data-action="view" data-view="app" title="Aplikasi Livin' nasabah">${I.phone}App Nasabah</button>
        <button class="${state.view === 'dashboard' ? 'on' : ''}" data-action="view" data-view="dashboard" title="Livin' Merchant Dashboard">${I.chart}Dashboard Merchant</button>
      </div>
      <section class="p-sec">
        <h4>Skenario cepat</h4>
        <div class="p-row"><span>Merchant</span><div class="seg sm">${D.merchants
          .map((m) => `<button class="${m.id === dm.id ? 'on' : ''}" data-action="demo-merchant" data-merchant="${m.id}">${esc(m.short)}</button>`)
          .join('')}</div></div>
        <div class="p-row"><span>Stamp ${esc(dm.short)}: <b>${c.stamps}/10</b></span><div class="p-btns">${[0, 3, 4, 9]
          .map((n) => `<button class="pbtn ${c.stamps === n ? 'on' : ''}" data-action="set-stamps" data-n="${n}" aria-label="Atur ke ${n} stamp">${n}</button>`)
          .join('')}</div></div>
        <p class="p-hint">Atur ke 4 atau 9, lalu bayar pesanan ≥ ${STAMP_RP} untuk melihat animasi kado di stamp ke-5 dan ke-10.</p>
        <button class="pbtn wide" data-action="demo-cart" data-kind="near">${I.cart}<span>Keranjang ${fmt(cartTotal('near'))}<small>Nudge “Tanggung banget!”</small></span></button>
        <button class="pbtn wide" data-action="demo-cart" data-kind="multi">${I.cart}<span>Keranjang ${fmt(cartTotal('multi'))}<small>2 stamp, sisa hangus</small></span></button>
        <button class="pbtn wide" data-action="demo-voucher">${I.ticket}<span>Beri Voucher Diskon 50%<small>Tes potongan vs. dasar stamp</small></span></button>
      </section>
      <section class="p-sec">
        <div class="p-row"><span>Efek suara</span><button class="toggle ${state.sound ? 'on' : ''}" data-action="toggle-sound" role="switch" aria-checked="${state.sound}" aria-label="Efek suara"><i></i></button></div>
        <button class="pbtn wide danger" data-action="reset">${I.reset}<span>Reset demo</span></button>
      </section>
      <section class="p-sec log">
        <h4>Log API (mock)<span class="count">${state.apiLog.length}</span></h4>
        ${state.apiLog.length ? state.apiLog.map(log).join('') : '<p class="p-hint">Belum ada panggilan. Bayar sebuah pesanan untuk melihat request ke Order Engine dan Promo Engine.</p>'}
      </section>`;
  }

  /* ---------- Render ---------- */
  function render(resetScroll) {
    Sound.enabled = state.sound;
    $('#app').dataset.view = state.view;
    $('#phone').hidden = state.view !== 'app';
    $('#dash').hidden = state.view !== 'dashboard';

    if (state.view === 'app') {
      const r = state.route;
      const m = r.merchantId ? merchantById(r.merchantId) : null;
      const key = r.name + ':' + (r.merchantId || '');
      const prev = $('#screen .scroll');
      const top = prev && !resetScroll && ui.renderedKey === key ? prev.scrollTop : 0;
      let html;
      if (r.name === 'merchant' && m) html = screenMerchant(m);
      else if (r.name === 'cart' && m) html = screenCart(m);
      else if (r.name === 'vouchers') html = screenVouchers();
      else if (r.name === 'history') html = screenHistory();
      else html = screenHome();
      $('#screen').innerHTML = html + sheetHTML();
      $('#phone').dataset.status = ['merchant', 'cart'].includes(r.name) ? 'white' : 'blue';
      const sc = $('#screen .scroll');
      if (sc) sc.scrollTop = top;
      ui.renderedKey = key;
    } else {
      renderDash();
    }
    renderPanel();
    save();
  }

  function go(route) {
    ui.stack.push(state.route);
    state.route = route;
    ui.sheet = null;
    render(true);
  }

  function back() {
    state.route = ui.stack.pop() || { name: 'home' };
    ui.sheet = null;
    render(true);
  }

  function tab(name) {
    ui.stack = [];
    ui.sheet = null;
    state.route = { name };
    render(true);
  }

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
  }

  /* ---------- Payment & celebration (PRD §3.3) ---------- */
  const wait = (ms) => (cele.skipped ? Promise.resolve() : sleep(reduceMotion() ? Math.min(ms, 150) : ms));

  async function pay(m) {
    if (ui.busy) return;
    const { lines, voucher, calc } = calcFor(m);
    if (!lines.length) return;
    ui.busy = true;
    Sound.unlock();
    const ov = $('#overlay');
    ov.innerHTML = `<div class="processing"><div class="spinner"></div><b>Memproses pembayaran</b><span>${fmt(calc.total)} · Livin' by Mandiri</span></div>`;
    ov.hidden = false;
    const started = state;
    await sleep(1100);
    if (state !== started) {
      // Demo was reset while paying.
      ov.hidden = true;
      ui.busy = false;
      return;
    }

    const order = S.createOrder(state, m, lines, calc, voucher);
    if (voucher) S.redeemVoucher(state, voucher, order, m);
    state.applied[m.id] = null;
    state.carts[m.id] = {};
    const { before, result } = S.awardStamps(state, m, order);
    const newVouchers = result.milestones.map((ms) => S.injectUserVoucher(state, D.user.id, m.id, ms.tier, order.id));

    ui.stack = [{ name: 'home' }];
    state.route = { name: 'merchant', merchantId: m.id };
    render(true);
    try {
      await celebrate(m, order, before, result, newVouchers);
    } finally {
      ui.busy = false;
    }
  }

  async function celebrate(m, order, before, result, vouchers) {
    cele.active = true;
    cele.skipped = false;
    $('#phone').classList.add('status-dark');
    const earned = order.stamps_earned;
    const usedVoucher = order.voucherId && state.vouchers.find((v) => v.id === order.voucherId);
    const freeMealOnly = !earned && usedVoucher && usedVoucher.tier === E.TIER_FREE_MEAL && order.items_subtotal === 0;
    const noStampTitle = freeMealOnly ? 'Selamat menikmati Free Meal!' : 'Pesanan ini belum dapat stamp';
    const noStampSub = freeMealOnly
      ? `${m.reward.name} gratis dari kartu stamp-mu.`
      : `Subtotal makanan ${fmt(order.stamp_basis)} belum mencapai ${STAMP_RP} dan tidak diakumulasi.`;
    const ov = $('#overlay');
    ov.innerHTML = `
      <div class="cele" role="dialog" aria-modal="true" aria-label="Pembayaran berhasil">
        <button class="cele-skip" data-action="cele-skip">Lewati</button>
        <div class="cele-top">
          <div class="cele-check">${I.check}</div>
          <div class="cele-paid">Pembayaran berhasil</div>
          <div class="cele-amt">${fmt(order.total)} · ${esc(m.branch)}</div>
        </div>
        <div class="cele-stage" id="cele-stage">
          <div class="cele-card" id="cele-card">${stampCardHTML(m, before)}</div>
          <div class="stamper" id="stamper">${STAMPER}</div>
        </div>
        <div class="cele-msg" aria-live="polite">
          <div class="cele-count" id="cele-count">${earned ? `Mengecap ${earned} stamp…` : noStampTitle}</div>
          <div class="cele-sub" id="cele-sub">${earned ? '&nbsp;' : esc(noStampSub)}</div>
        </div>
        <div class="cele-actions" id="cele-actions"></div>
      </div>`;
    ov.hidden = false;
    await wait(750);

    let shownCycle = before.cycle;
    for (let i = 0; i < result.steps.length; i++) {
      if (!cele.active) return;
      const step = result.steps[i];
      if (step.cycle !== shownCycle) {
        await swapCard(m, step.cycle);
        shownCycle = step.cycle;
      }
      await dropStamp(step.slot, i);
      setText('cele-count', `+${i + 1} Stamp ${m.name}!`);
      setText('cele-sub', step.slot === CYCLE ? '10/10 · Kartu penuh!' : `${step.slot}/10 · ${nextMilestoneText(m, step.slot)}`);
      await wait(260);
    }
    if (!cele.active) return;

    if (vouchers.length) {
      await wait(450);
      await giftScene(m, vouchers);
    } else {
      finishActions([
        ['primary', 'Lihat Kartu Stamp', 'merchant'],
        ['ghost', 'Ke Beranda', 'home'],
      ]);
    }
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  async function dropStamp(slot, i) {
    const stage = $('#cele-stage');
    const stamper = $('#stamper');
    const slotEl = stage && stage.querySelector(`.slot[data-slot="${slot}"]`);
    if (!slotEl || !stamper) return;
    let done = false;
    const fill = () => {
      const card = $('#cele-card');
      if (done || !card) return;
      done = true;
      slotEl.classList.add('filled', 'just');
      slotEl.innerHTML = FORK;
      card.classList.remove('thump');
      void card.offsetWidth;
      card.classList.add('thump');
      if (!cele.skipped) {
        Sound.thud();
        Sound.chime(i);
      }
    };
    if (cele.skipped || reduceMotion()) {
      fill();
      await wait(220);
      return;
    }
    const sr = stage.getBoundingClientRect();
    const r = slotEl.getBoundingClientRect();
    const x = r.left - sr.left + r.width / 2 - 40;
    const y = r.top - sr.top + r.height / 2 - 88;
    const dur = 1100;
    const anim = stamper.animate(
      [
        { transform: `translate(${x + 34}px, ${y - 210}px) rotate(16deg)`, opacity: 0 },
        { transform: `translate(${x + 8}px, ${y - 46}px) rotate(5deg)`, opacity: 1, offset: 0.45 },
        { transform: `translate(${x}px, ${y}px) rotate(0deg) scale(1.05, 0.9)`, opacity: 1, offset: 0.62 },
        { transform: `translate(${x}px, ${y - 3}px) rotate(0deg) scale(1)`, opacity: 1, offset: 0.76 },
        { transform: `translate(${x - 12}px, ${y - 170}px) rotate(-10deg)`, opacity: 0 },
      ],
      { duration: dur, easing: 'ease-in-out', fill: 'both' }
    );
    setTimeout(fill, dur * 0.62);
    try {
      await anim.finished;
    } catch (e) {
      /* cancelled */
    }
    fill();
  }

  async function swapCard(m, cycle) {
    const card = $('#cele-card');
    setText('cele-count', 'Kartu penuh! 🎉');
    setText('cele-sub', `Lanjut ke kartu ke-${cycle}`);
    await wait(650);
    if (!cele.active || !card.isConnected) return;
    const animate = !cele.skipped && !reduceMotion();
    if (animate) await card.animate([{ transform: 'rotateY(0)' }, { transform: 'rotateY(90deg)' }], { duration: 220, easing: 'ease-in' }).finished;
    card.innerHTML = stampCardHTML(m, { stamps: 0, cycle });
    if (animate) await card.animate([{ transform: 'rotateY(-90deg)' }, { transform: 'rotateY(0)' }], { duration: 260, easing: 'ease-out' }).finished;
  }

  async function giftScene(m, vouchers) {
    const stage = $('#cele-stage');
    if (!cele.active || !stage) return;
    const hasFree = vouchers.some((v) => v.tier === E.TIER_FREE_MEAL);
    setText('cele-count', hasFree ? 'Stamp ke-10! Hadiahmu siap' : 'Stamp ke-5! Kamu dapat hadiah');
    setText('cele-sub', 'Membuka kado…');
    if (!cele.skipped && !reduceMotion()) {
      await $('#cele-card').animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.85)' }], { duration: 280, fill: 'forwards' }).finished;
    }
    if (!cele.active) return;
    const ticket = (v) => {
      const is50 = v.tier === E.TIER_DISC50;
      return `<div class="rticket ${is50 ? 'v50' : 'vfm'}"><div class="rt-stub">${is50 ? '50%' : 'FREE'}</div><div class="rt-body"><b>${esc(v.title)}</b><span>${esc(m.name)} · berlaku ${E.RULES.VOUCHER_VALID_DAYS} hari</span></div></div>`;
    };
    stage.innerHTML = `<div class="gift-scene" id="gift-scene">
        <div class="rays"></div>
        <div class="reward-stack">${vouchers.map(ticket).join('')}</div>
        <div class="gift" id="gift"><div class="gift-lid"><i class="bow l"></i><i class="bow r"></i></div><div class="gift-body"></div></div>
      </div>`;
    const gift = $('#gift');
    await wait(350);
    gift.classList.add('shake');
    await wait(1000);
    if (!cele.active) return;
    gift.classList.remove('shake');
    $('#gift-scene').classList.add('opened');
    if (!cele.skipped) {
      Sound.fanfare();
      if (!reduceMotion()) confetti($('#overlay .cele'));
    }
    setText('cele-count', 'Selamat, voucher sudah masuk!');
    setText('cele-sub', vouchers.map((v) => v.title).join(' + '));
    await wait(650);
    if (!cele.active) return;
    finishActions([
      ['primary', 'Lihat Voucher Saya', 'vouchers'],
      ['ghost', 'Nanti saja', 'merchant'],
    ]);
  }

  function finishActions(buttons) {
    const skip = $('#overlay .cele-skip');
    if (skip) skip.hidden = true;
    const box = $('#cele-actions');
    box.innerHTML = buttons.map(([kind, label, to]) => `<button class="btn ${kind} block" data-action="cele-close" data-to="${to}">${label}</button>`).join('');
    box.classList.add('show');
    const first = box.querySelector('button');
    if (first) first.focus({ preventScroll: true });
  }

  function closeCelebration(to) {
    const ov = $('#overlay');
    ov.hidden = true;
    ov.innerHTML = '';
    $('#phone').classList.remove('status-dark');
    cele.active = false;
    if (to === 'vouchers') {
      state.voucherTab = 'active';
      tab('vouchers');
    } else if (to === 'home') tab('home');
    else render(true);
  }

  function confetti(host) {
    const colors = ['#FFC72C', '#1EA0F0', '#FFFFFF', '#FF8A3D', '#7ED0FF'];
    const W = host.clientWidth;
    const H = host.clientHeight;
    for (let i = 0; i < 70; i++) {
      const p = document.createElement('i');
      p.className = 'confetti';
      const w = 6 + Math.random() * 6;
      p.style.cssText = `left:${Math.random() * W}px;width:${w}px;height:${w * (0.4 + Math.random() * 0.6)}px;background:${colors[i % colors.length]}`;
      host.appendChild(p);
      const drift = (Math.random() - 0.5) * 140;
      const a = p.animate(
        [
          { transform: 'translate(0,-20px) rotate(0deg)', opacity: 1 },
          { transform: `translate(${drift}px, ${H + 40}px) rotate(${360 + Math.random() * 540}deg)`, opacity: 0.9 },
        ],
        { duration: 1800 + Math.random() * 1600, delay: Math.random() * 400, easing: 'cubic-bezier(.2,.6,.4,1)', fill: 'backwards' }
      );
      a.onfinish = () => p.remove();
    }
  }

  /* ---------- Events ---------- */
  function onAction(el) {
    const a = el.dataset.action;
    const m = el.dataset.merchant ? merchantById(el.dataset.merchant) : null;
    switch (a) {
      case 'go':
        go({ name: el.dataset.route, merchantId: el.dataset.merchant });
        break;
      case 'back':
        back();
        break;
      case 'tab':
        tab(el.dataset.tab);
        break;
      case 'toast':
        toast(el.dataset.msg);
        break;
      case 'add': {
        const beforeStamps = calcFor(m).calc.stamps_earned;
        setQty(m, el.dataset.item, (state.carts[m.id][el.dataset.item] || 0) + 1);
        const after = calcFor(m).calc.stamps_earned;
        render();
        if (state.route.name === 'cart' && after > beforeStamps) toast(`Mantap! Pesanan ini sekarang dapat ${after} Stamp 🎉`);
        break;
      }
      case 'dec':
        setQty(m, el.dataset.item, (state.carts[m.id][el.dataset.item] || 0) - 1);
        render();
        break;
      case 'scroll-cat': {
        const sc = $('#screen .scroll');
        const sec = document.getElementById('cat-' + el.dataset.cat);
        if (sc && sec) sc.scrollTo({ top: sec.offsetTop - 56, behavior: reduceMotion() ? 'auto' : 'smooth' });
        break;
      }
      case 'sheet':
        ui.sheet = el.dataset.sheet;
        render();
        break;
      case 'close-sheet':
        ui.sheet = null;
        render();
        break;
      case 'apply': {
        const v = state.vouchers.find((x) => x.id === el.dataset.voucher);
        state.applied[v.merchantId] = v.id;
        ui.sheet = null;
        render();
        toast('Voucher terpasang');
        break;
      }
      case 'unapply':
        state.applied[m.id] = null;
        render();
        break;
      case 'use-voucher': {
        const v = state.vouchers.find((x) => x.id === el.dataset.voucher);
        state.applied[v.merchantId] = v.id;
        ui.stack = [{ name: 'vouchers' }];
        if (v.tier === E.TIER_FREE_MEAL) {
          ui.stack.push({ name: 'merchant', merchantId: v.merchantId });
          state.route = { name: 'cart', merchantId: v.merchantId };
          render(true);
          toast('Free Meal masuk ke keranjang');
        } else {
          state.route = { name: 'merchant', merchantId: v.merchantId };
          render(true);
          toast('Voucher terpasang. Pilih menumu!');
        }
        break;
      }
      case 'voucher-tab':
        state.voucherTab = el.dataset.tab;
        render(true);
        break;
      case 'pay':
        pay(m);
        break;
      case 'cele-skip':
        cele.skipped = true;
        document.getAnimations().forEach((an) => {
          const target = an.effect && an.effect.target;
          if (!target || !$('#overlay').contains(target)) return;
          try {
            an.finish();
          } catch (e) {
            /* infinite CSS animations can't finish; leave them */
          }
        });
        break;
      case 'cele-close':
        closeCelebration(el.dataset.to);
        break;

      // Demo panel
      case 'view':
        state.view = el.dataset.view;
        render(true);
        break;
      case 'demo-merchant':
        state.demoMerchant = el.dataset.merchant;
        render();
        break;
      case 'set-stamps':
        state.cards[state.demoMerchant].stamps = Number(el.dataset.n);
        state.view = 'app';
        render();
        toast(`Stamp ${merchantById(state.demoMerchant).name} diatur ke ${el.dataset.n}/10`);
        break;
      case 'demo-cart': {
        const dm = merchantById(state.demoMerchant);
        state.carts[dm.id] = Object.assign({}, D.demoCarts[dm.id][el.dataset.kind]);
        state.view = 'app';
        ui.stack = [{ name: 'home' }, { name: 'merchant', merchantId: dm.id }];
        state.route = { name: 'cart', merchantId: dm.id };
        ui.sheet = null;
        render(true);
        break;
      }
      case 'demo-voucher': {
        const dm = merchantById(state.demoMerchant);
        S.injectUserVoucher(state, D.user.id, dm.id, E.TIER_DISC50, 'DEMO');
        render();
        toast(`Voucher Diskon 50% ${dm.name} ditambahkan`);
        break;
      }
      case 'toggle-sound':
        state.sound = !state.sound;
        render();
        if (state.sound) {
          Sound.enabled = true;
          Sound.chime(2);
        }
        break;
      case 'reset':
        if (cele.active) closeCelebration('home');
        state = defaultState();
        ui.stack = [];
        ui.sheet = null;
        ui.openLogs.clear();
        render(true);
        toast('Demo direset');
        break;

      // Merchant dashboard
      case 'dash-merchant':
        state.dashMerchant = el.dataset.merchant;
        render();
        break;
      case 'dash-filter':
        state.dashFilter = el.dataset.filter;
        render();
        break;
      case 'export-csv':
        exportCsv();
        break;
      case 'submit-recon': {
        const dm = merchantById(state.dashMerchant);
        const pending = dashRows(dm).filter((r) => r.status === 'pending');
        state.reconSubmitted[dm.id] = (state.reconSubmitted[dm.id] || []).concat(pending.filter((r) => !r.demo).map((r) => r.id));
        state.vouchers.forEach((v) => {
          if (v.merchantId === dm.id && v.status === 'used' && v.recon === 'pending') v.recon = 'submitted';
        });
        S.submitReconciliation(state, dm.id, pending.map((r) => r.voucherId));
        render();
        break;
      }
    }
  }

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el || el.disabled) return;
    if (ui.busy && !el.dataset.action.startsWith('cele') && el.closest('#phone')) return;
    onAction(el);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && ui.sheet) {
      ui.sheet = null;
      render();
    }
  });

  document.addEventListener(
    'toggle',
    (e) => {
      const d = e.target;
      if (d.matches && d.matches('details[data-log]')) {
        if (d.open) ui.openLogs.add(d.dataset.log);
        else ui.openLogs.delete(d.dataset.log);
      }
    },
    true
  );

  // After a reload the back stack is empty, so Back from a merchant or cart goes home.
  if (state.route.name === 'cart' || state.route.name === 'merchant') ui.stack = [{ name: 'home' }];
  $('#sb-icons').innerHTML = I.signal + I.wifi + I.battery;
  render(true);
})();
