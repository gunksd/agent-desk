'use strict';
const BNB = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const USDT = '0x55d398326f99059fF775485246999027B3197955';
const $ = id => document.getElementById(id);

// Curated default token list (symbol, address, logo). Mirrors what a real
// BSC trading UI offers out of the box; discovered tokens get appended at runtime.
const TW = a => `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/assets/${a}/logo.png`;
const DEFAULT_TOKENS = [
  {address: BNB, symbol: 'BNB', name: 'BNB', cls: 'bnb', logo: 'https://gmgn.ai/external-res/a477e8924def57eea4994c5a1d874f8b.webp'},
  {address: USDT, symbol: 'USDT', name: 'Tether USD', cls: 'usdt', logo: 'https://gmgn.ai/external-res/9b392f75b01799a82ba73a6f61355599.webp'},
  {address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', symbol: 'USDC', name: 'USD Coin', logo: 'https://gmgn.ai/external-res/4f16b3a2e75ccf0e01bf47ad742b9507_v2l.webp'},
  {address: '0xc5f0f7b66764F6ec8C8Dff7BA683102295E16409', symbol: 'FDUSD', name: 'First Digital USD', logo: TW('0xc5f0f7b66764F6ec8C8Dff7BA683102295E16409')},
  {address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', symbol: 'BUSD', name: 'Binance USD', logo: 'https://gmgn.ai/external-res/2bc2b7925c232acbbc49cfef29380f1d.webp'},
  {address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', symbol: 'WBNB', name: 'Wrapped BNB', logo: 'https://gmgn.ai/external-res/a477e8924def57eea4994c5a1d874f8b.webp'},
  {address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', symbol: 'BTCB', name: 'Bitcoin BEP20', logo: 'https://gmgn.ai/external-res/1e4010ae537288798c5367f33eae13b3.webp'},
  {address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', symbol: 'ETH', name: 'Ethereum', logo: 'https://gmgn.ai/external-res/c4193aef2f69ed71ced3fcf723b5c6af.webp'},
  {address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', symbol: 'CAKE', name: 'PancakeSwap', logo: 'https://gmgn.ai/external-res/0345128a31d504789cb0a579babb9b5f.webp'},
  {address: '0xbA2aE424d960c26247Dd6c32edC70B295c744C43', symbol: 'DOGE', name: 'Dogecoin', logo: TW('0xbA2aE424d960c26247Dd6c32edC70B295c744C43')},
  {address: '0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE', symbol: 'XRP', name: 'XRP', logo: TW('0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE')},
  {address: '0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47', symbol: 'ADA', name: 'Cardano', logo: TW('0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47')},
  {address: '0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD', symbol: 'LINK', name: 'Chainlink', logo: TW('0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD')},
  {address: '0xBf5140A22578168FD562DCcF235E5D43A02ce9B1', symbol: 'UNI', name: 'Uniswap', logo: TW('0xBf5140A22578168FD562DCcF235E5D43A02ce9B1')},
  {address: '0x4338665CBB7B2485A8855A139b75D5e34AB0DB94', symbol: 'LTC', name: 'Litecoin', logo: TW('0x4338665CBB7B2485A8855A139b75D5e34AB0DB94')},
];
const KNOWN = {};
for (const t of DEFAULT_TOKENS) KNOWN[t.address.toLowerCase()] = {decimals: 18, ...t, symbolShort: t.symbol};
const PLATFORM_NAMES = {
  fourmeme: 'four.meme', fouragent: 'four.meme Agent 专属', flap: 'Flap', flapagent: 'Flap Agent', agentpad: 'AgentPad', gang: 'Gang',
  gangpair: 'Gang Pair', gangv2: 'Gang V2', cycpad: 'Cycpad', moat: 'MOAT', units: 'UNITS', pancake: '外盘 PancakeSwap',
};
const PAIRS = [['USDT', 'BNB', 'USDT → BNB'], ['BNB', 'USDT', 'BNB → USDT']];

const STABLES = new Set(['0x55d398326f99059ff775485246999027b3197955', '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', '0xc5f0f7b66764f6ec8c8dff7ba683102295e16409', '0xe9e7cea3dedca5984780bafc599bd69add087d56']);
const state = {
  from: BNB, to: USDT, slippage: 'auto', gas: 'HIGH',
  wallet: null, balances: {}, tokens: {}, quote: null, quoteSeq: 0,
  busy: false, picker: null, pickerSeq: 0,
};

const resolve = s => s === 'BNB' ? BNB : s === 'USDT' ? USDT : s;
const short = a => a ? a.slice(0, 6) + '…' + a.slice(-4) : '—';
function sym(info) { return info.symbolShort || info.symbol || short(info.address); }
function tokenInfo(addr) { const k = (addr || '').toLowerCase(); return state.tokens[k] || KNOWN[k] || {address: addr, symbol: short(addr), name: '未知代币', decimals: 18}; }

function iconHTML(info, cls = 'tok-ico') {
  const a = info.address.toLowerCase();
  const kind = info.cls || (a === BNB.toLowerCase() ? 'bnb' : a === USDT.toLowerCase() ? 'usdt' : '');
  const inner = info.logo ? `<img src="${info.logo}" referrerpolicy="no-referrer" alt="">` : (sym(info) || '?').slice(0, 2).toUpperCase();
  return `<span class="${cls} ${kind}">${inner}</span>`;
}
function trim(v) {
  const n = typeof v === 'number' ? v : parseFloat(v);
  if (!isFinite(n)) return String(v);
  if (n === 0) return '0';
  if (n >= 1) return n.toLocaleString('en-US', {maximumFractionDigits: 6});
  return n.toPrecision(6).replace(/\.?0+$/, '');
}

// USD value of an amount of a token: stablecoins 1:1, BNB/WBNB via cached BNB price,
// anything else priced through the current quote's BNB/USDT leg.
async function loadBnbPrice() {
  const had = !!state.bnbUsd;
  try { const x = await (await fetch('/bnbprice')).json(); if (x.success && x.data.usdt) state.bnbUsd = x.data.usdt; } catch {}
  renderUsd();
  if (!had && state.bnbUsd) loadHistory();
}
function usdOf(addr, amount) {
  const a = (addr || '').toLowerCase(), n = parseFloat(amount);
  if (!isFinite(n) || n <= 0) return null;
  if (STABLES.has(a)) return n;
  if ((a === BNB.toLowerCase() || a === '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c') && state.bnbUsd) return n * state.bnbUsd;
  return null;
}
const usdNum = v => v >= 1 ? v.toLocaleString('en-US', {maximumFractionDigits: 2}) : v.toPrecision(3);
function fmtUsd(v) { return v == null ? '' : `（≈ ${usdNum(v)} U）`; }
function renderUsd() {
  const fa = $('fromAmt').value.trim(), ta = (state.quote && state.quote.toCoinAmount) || '';
  let fu = usdOf(state.from, fa), tu = usdOf(state.to, ta);
  // a meme leg takes the value of the other (priced) leg, since the quote equates them
  if (fu == null && tu != null) fu = tu;
  if (tu == null && fu != null && ta) tu = fu;
  $('fromUsd').textContent = fmtUsd(fu); $('toUsd').textContent = ta ? fmtUsd(tu) : '';
}
function renderTokButtons() {
  for (const [side, addr] of [['from', state.from], ['to', state.to]]) {
    const info = tokenInfo(addr);
    $(side + 'Tok').innerHTML = iconHTML(info) + `<span>${sym(info)}</span><span class="car">▾</span>`;
  }
  $('fromBal').textContent = '余额：' + (state.balances[state.from.toLowerCase()] ?? '—');
  $('toBal').textContent = '余额：' + (state.balances[state.to.toLowerCase()] ?? '—');
}
function renderPairs() {
  $('pairs').innerHTML = '';
  for (const [f, t, label] of PAIRS) {
    const b = document.createElement('button');
    b.className = 'pair'; b.textContent = label;
    b.onclick = () => { state.from = resolve(f); state.to = resolve(t); afterPairChange(); };
    $('pairs').appendChild(b);
  }
}
function afterPairChange() { renderTokButtons(); ensureMeta([state.from, state.to]); scheduleQuote(); refreshTokenCard(); refreshRoute(); }

// Detect which launchpad a non-base token belongs to and badge it.
let routeSeq = 0;
async function refreshRoute() {
  const el = $('routeBadge'), token = activeCustomToken();
  if (!token) { el.textContent = 'Binance 聚合'; el.className = 'route-badge'; return; }
  const seq = ++routeSeq; el.textContent = '识别平台…'; el.className = 'route-badge';
  try {
    const x = await (await fetch('/route?token=' + encodeURIComponent(token))).json();
    if (seq !== routeSeq) return;
    const r = x.data || {}, name = PLATFORM_NAMES[r.platform] || r.platform || '未知';
    el.textContent = r.venue === 'direct' ? `${name} · 曲线直调` : `${name} · 聚合路由`;
    el.className = 'route-badge ' + (r.venue === 'direct' ? 'direct' : 'agg');
  } catch { if (seq === routeSeq) el.textContent = '平台未识别'; }
}

// Direct-contract trades bypass baw's order book, so keep a local log and merge it into history.
const DIRECT_KEY = 'agentdesk.directTrades';
function loadDirect() { try { return JSON.parse(localStorage.getItem(DIRECT_KEY) || '[]'); } catch { return []; } }
function recordDirect(t) {
  const fi = tokenInfo(t.from), ti = tokenInfo(t.to);
  const row = {orderId: t.txHash, fromToken: t.from, toToken: t.to, fromTokenName: sym(fi), toTokenName: sym(ti),
    fromTokenQty: t.qty, toTokenActualQty: null, status: 'FINISHED', txHash: t.txHash,
    bookTime: new Date().toISOString(), platform: t.platform, direct: true};
  localStorage.setItem(DIRECT_KEY, JSON.stringify([row, ...loadDirect()].slice(0, 100)));
}

// ---------- views ----------
function showView(v) {
  for (const el of document.querySelectorAll('.view')) el.hidden = el.id !== 'view-' + v;
  for (const b of document.querySelectorAll('.nav-item')) b.classList.toggle('active', b.dataset.view === v);
  if (v === 'monitor') { loadStatus(); loadAlerts(); }
  if (v === 'activity') { loadHistory(); loadAlerts(); }
}
window.showView = showView;

// ---------- wallet ----------
async function loadWallet() {
  const extra = Object.values(state.tokens).map(t => t.address);
  await ensureMeta([state.from, state.to, ...extra], true);
  renderBalances();
}
async function ensureMeta(addrs, force) {
  // BNB & USDT are base assets: balances come from dedicated fields and their
  // logos live in KNOWN — don't run a per-token meta query that would overwrite them.
  const base = [BNB.toLowerCase(), USDT.toLowerCase()];
  const want = [...new Set(addrs.map(a => a.toLowerCase()).filter(a => !base.includes(a)))];
  const need = force ? want : want.filter(a => !(a in state.balances));
  try {
    const url = '/meta' + (need.length ? '?tokens=' + encodeURIComponent(need.join(',')) : '');
    const x = await (await fetch(url)).json();
    if (!x.success) throw Error(x.error?.message || '读取失败');
    state.wallet = x.data.wallet;
    state.balances[BNB.toLowerCase()] = x.data.BNB;
    state.balances[USDT.toLowerCase()] = x.data.USDT;
    for (const [k, v] of Object.entries(x.data.tokens || {})) {
      if (v.error) continue;
      state.tokens[k] = {...(state.tokens[k] || {}), ...v, cls: ''};
      state.balances[k] = v.balance;
      KNOWN[k] = KNOWN[k] || state.tokens[k];
    }
    $('walletAddr').textContent = state.wallet;
    drawBlockies(state.wallet);
    renderTokButtons();
  } catch (e) { $('walletAddr').textContent = '余额读取失败：' + e.message; }
}
function renderBalances() {
  const list = $('balList'); list.innerHTML = '';
  const shown = [BNB.toLowerCase(), USDT.toLowerCase(), ...Object.keys(state.tokens)].filter((v, i, a) => a.indexOf(v) === i);
  for (const k of shown) {
    const info = tokenInfo(k), bal = state.balances[k] ?? '—';
    const el = document.createElement('div');
    el.className = 'li';
    el.innerHTML = `<div class="l">${iconHTML(info)}<div><div style="font-weight:650">${sym(info)}</div>`
      + `<div class="addr mono">${info.address.toLowerCase() === BNB.toLowerCase() ? '原生代币' : short(info.address)}</div></div></div>`
      + `<div class="v">${bal}</div>`;
    list.appendChild(el);
  }
}
// Exact decimal math on balance strings (no floats): parse to an integer of
// 10^-18 units, scale by an integer percentage, format back without rounding.
const DEC = 18n;
function toUnits(str) {
  const [a, b = ''] = String(str).trim().split('.');
  return BigInt(a || '0') * 10n ** DEC + BigInt((b + '0'.repeat(Number(DEC))).slice(0, Number(DEC)) || '0');
}
function fromUnits(u) {
  const s = u.toString().padStart(Number(DEC) + 1, '0');
  const i = s.slice(0, -Number(DEC)), f = s.slice(-Number(DEC)).replace(/0+$/, '');
  return f ? i + '.' + f : i;
}
function usePct(frac) {
  state.allSelected = frac === 1;
  const k = state.from.toLowerCase(), raw = state.balances[k];
  if (raw == null) return;
  let avail = toUnits(raw);
  // native BNB: keep 0.001 back for gas
  if (k === BNB.toLowerCase()) avail = avail > 10n ** 15n ? avail - 10n ** 15n : 0n;
  if (avail <= 0n) return;
  const pct = BigInt(Math.round(frac * 100));
  const amt = pct === 100n ? avail : avail * pct / 100n;
  if (amt <= 0n) return;
  $('fromAmt').value = fromUnits(amt);
  scheduleQuote();
}

// ---------- blockies wallet logo ----------
function drawBlockies(addr) {
  const cv = $('brandIcon'); if (!cv || !addr) return;
  const ctx = cv.getContext('2d'); const S = 32, N = 8, px = S / N;
  // seedable PRNG from address
  let seed = 0; for (let i = 0; i < addr.length; i++) seed = (seed * 31 + addr.charCodeAt(i)) >>> 0;
  const rnd = () => { seed = (seed * 1103515245 + 12345) >>> 0; return seed / 4294967296; };
  // gold-family palette so it matches brand
  const h = 60 + Math.floor(rnd() * 40);
  const fg = `hsl(${h} 60% 45%)`, bg = 'hsl(45 30% 96%)', sp = `hsl(${h} 70% 62%)`;
  ctx.fillStyle = bg; ctx.fillRect(0, 0, S, S);
  for (let y = 0; y < N; y++) for (let x = 0; x < N / 2; x++) {
    const v = rnd(); if (v < 0.5) continue;
    ctx.fillStyle = v > 0.82 ? sp : fg;
    ctx.fillRect(x * px, y * px, px, px);
    ctx.fillRect((N - 1 - x) * px, y * px, px, px);
  }
}

// ---------- quote ----------
let quoteTimer = null;
function scheduleQuote() {
  clearTimeout(quoteTimer);
  const amt = $('fromAmt').value.trim();
  state.quote = null; $('quoteBox').classList.remove('show'); renderUsd();
  if (!amt || !(parseFloat(amt) > 0)) { $('toAmt').value = ''; setCta(); return; }
  setCta('quoting'); quoteTimer = setTimeout(getQuote, 380);
}
async function getQuote() {
  const seq = ++state.quoteSeq, amt = $('fromAmt').value.trim();
  setStatus('获取报价…', true);
  try {
    const x = await (await fetch('/quote', {method: 'POST', headers: {'content-type': 'application/json'},
      body: JSON.stringify({fromToken: state.from, toToken: state.to, qty: amt, slippage: state.slippage, fromSymbol: sym(tokenInfo(state.from)), toSymbol: sym(tokenInfo(state.to))})})).json();
    if (seq !== state.quoteSeq) return;
    if (!x.success) throw Error(x.error?.message || '报价失败');
    state.quote = x.data; $('toAmt').value = trim(x.data.toCoinAmount); renderUsd();
    renderQuote(x.data, amt); setStatus('报价完成', false);
  } catch (e) { if (seq === state.quoteSeq) { $('toAmt').value = ''; setStatus('报价失败：' + e.message, false); } }
  setCta();
}
function renderQuote(d, payAmt) {
  const got = parseFloat(d.toCoinAmount), pay = parseFloat(payAmt);
  $('qRate').textContent = `1 ${d.fromCoinSymbol} ≈ ${trim(got / pay)} ${d.toCoinSymbol}`;
  const slip = typeof d.slippage === 'number' ? d.slippage : parseFloat(d.slippage || 0);
  const minOut = got * (1 - slip);
  const toU = usdOf(state.to, d.toCoinAmount) ?? usdOf(state.from, payAmt);
  $('qMin').textContent = `${trim(minOut)} ${d.toCoinSymbol}` + (toU != null ? ` （≈ ${usdNum(toU * (1 - slip))} U）` : '');
  const pct = slip * 100, el = $('qImpact');
  el.textContent = pct ? pct.toFixed(2) + '%（滑点上限）' : '自动';
  el.className = 'impact ' + (pct <= 1 ? 'lo' : pct <= 5 ? 'mid' : 'hi');
  const r = d.route, plat = r ? (PLATFORM_NAMES[r.platform] || r.platform) : '';
  $('qRoute').textContent = d.venue === 'direct' ? `${plat} 曲线直调` : (plat ? `Binance 聚合 · ${plat}` : 'Binance 聚合');
  $('qNote').textContent = d.note || ''; $('qNote').style.display = d.note ? '' : 'none';
  $('quoteBox').classList.add('show');
}

// ---------- swap ----------
function setCta(stateName) {
  const cta = $('cta'), amt = $('fromAmt').value.trim();
  if (state.busy) { cta.disabled = true; return; }
  if (stateName === 'quoting') { cta.disabled = true; cta.textContent = '获取报价中…'; return; }
  if (!amt || !(parseFloat(amt) > 0)) { cta.disabled = true; cta.textContent = '输入数量'; return; }
  cta.disabled = !state.quote;
  cta.textContent = state.quote ? `兑换 ${sym(tokenInfo(state.from))} → ${sym(tokenInfo(state.to))}` : '等待报价';
}
async function doSwap() {
  if (state.busy || !state.quote) return;
  const amt = $('fromAmt').value.trim();
  state.busy = true; document.querySelectorAll('button,input').forEach(e => e.disabled = true);
  setCta(); setStatus('提交钱包…', true);
  const t0 = performance.now();
  try {
    const x = await (await fetch('/swap', {method: 'POST', headers: {'content-type': 'application/json'},
      body: JSON.stringify({fromToken: state.from, toToken: state.to, qty: amt, slippage: state.slippage, gasLevel: state.gas, all: !!state.allSelected})})).json();
    if (!x.success) throw Error(x.error?.message || '提交失败');
    if (x.data.venue === 'direct') {
      const h = x.data.txHash;
      setStatus(h ? `已上链：${h.slice(0, 10)}… · ${sec(t0)}` : `已提交 · ${sec(t0)}`, false);
      if (h) recordDirect({txHash: h, side: state.from.toLowerCase() === BNB.toLowerCase() ? 'buy' : 'sell', from: state.from, to: state.to, qty: amt, platform: x.data.route?.platform});
      return;
    }
    const id = x.data.orderId;
    setStatus('已提交订单 ' + id + '，等待确认…', true);
    for (let i = 0; i < 24; i++) {
      await sleep(1500);
      const o = await (await fetch('/order?id=' + encodeURIComponent(id))).json();
      const order = o.data?.list?.[0];
      if (order?.status === 'FINISHED') { setStatus(`成交：收到 ${trim(order.toTokenActualQty)} ${order.toTokenName} · ${sec(t0)}`, false); break; }
      if (order?.status === 'FAILED') throw Error('订单失败（见记录）');
    }
  } catch (e) { setStatus('未完成：' + e.message, false); }
  finally {
    state.busy = false; document.querySelectorAll('button,input').forEach(e => e.disabled = false);
    $('fromAmt').value = ''; $('toAmt').value = ''; state.quote = null; $('quoteBox').classList.remove('show'); setCta();
    loadWallet(); loadHistory();
  }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const sec = t0 => ((performance.now() - t0) / 1000).toFixed(1) + 's';
function setStatus(m, b) { $('statusText').textContent = m; $('status').classList.toggle('busy', !!b); }

function flip() { [state.from, state.to] = [state.to, state.from]; $('fromAmt').value = ''; $('toAmt').value = ''; renderTokButtons(); scheduleQuote(); refreshTokenCard(); }

// ---------- settings ----------
function toggleSettings() { $('settings').classList.toggle('show'); }
function setSlip(v) { state.slippage = v; $('slipCustom').value = ''; [...$('slipSeg').children].forEach(b => b.classList.toggle('on', b.dataset.v === v)); $('slipLabel').textContent = v === 'auto' ? '自动' : v + '%'; scheduleQuote(); }
function setGas(v) { state.gas = v; [...$('gasSeg').children].forEach(b => b.classList.toggle('on', b.dataset.v === v)); }

// ---------- token info card (swap view) ----------
let tiSeq = 0;
function activeCustomToken() {
  const base = [BNB.toLowerCase(), USDT.toLowerCase()];
  for (const a of [state.to, state.from]) if (!base.includes(a.toLowerCase())) return a;
  return null;
}
function tokenInfoCells(d, token) {
  const usd = v => v == null ? '—' : '$' + (v >= 1 ? Math.round(v).toLocaleString('en-US') : trim(v));
  const pct = v => v == null ? '—' : (v * 100).toFixed(v * 100 % 1 ? 1 : 0) + '%';
  return [
    ['价格', d.price ? '$' + trim(d.price) : '—'],
    ['市值', d.market_cap ? usd(d.market_cap) : '—'],
    d.curve ? ['内盘进度', d.progress != null ? pct(d.progress) : '内盘中'] : ['流动性', d.liquidity ? usd(d.liquidity) : '—'],
    ['持有人', d.holder_count ?? '—'],
    ['买入税', pct(d.buy_tax)],
    ['卖出税', pct(d.sell_tax)],
  ];
}
function riskBadges(d) {
  const b = [];
  if (d.is_honeypot === 'yes') b.push(['貔貅风险', 'bad']); else if (d.is_honeypot === 'no') b.push(['非貔貅', 'ok']);
  if (d.renounced === 'yes') b.push(['已弃权', 'ok']);
  if (d.rug_ratio != null) b.push(['rug ' + (d.rug_ratio * 100).toFixed(0) + '%', d.rug_ratio > 0.3 ? 'bad' : d.rug_ratio > 0.1 ? 'warn' : 'ok']);
  return b;
}
async function refreshTokenCard() {
  const card = $('tokCard'), token = activeCustomToken();
  if (!token) { card.classList.remove('show'); return; }
  const seq = ++tiSeq;
  try {
    const x = await (await fetch('/tokeninfo?token=' + encodeURIComponent(token))).json();
    if (seq !== tiSeq) return;
    if (!x.success) { card.classList.remove('show'); return; }
    const d = x.data;
    $('tiIc').innerHTML = d.logo ? `<img src="${d.logo}" referrerpolicy="no-referrer" alt="">` : (d.symbol || '?').slice(0, 2).toUpperCase();
    $('tiName').textContent = d.name || '未知'; $('tiSym').textContent = d.symbol ? '· ' + d.symbol : '';
    $('tiAddr').textContent = token;
    $('tiLp').textContent = d.launchpad || ''; $('tiLp').style.display = d.launchpad ? '' : 'none';
    $('tiGrid').innerHTML = tokenInfoCells(d, token).map(([k, v]) => `<div class="c"><div class="k">${k}</div><div class="v">${v}</div></div>`).join('');
    $('tiBadges').innerHTML = riskBadges(d).map(([t, c]) => `<span class="badge ${c}">${t}</span>`).join('');
    card.classList.add('show');
  } catch { if (seq === tiSeq) card.classList.remove('show'); }
}

// ---------- token picker: search SHOWS live content ----------
function openPicker(side) {
  state.picker = side;
  $('pickerTitle').textContent = side === 'from' ? '选择支付代币' : '选择收到代币';
  $('pickerInput').value = ''; renderPickerList(''); $('picker').showModal();
  setTimeout(() => $('pickerInput').focus(), 30);
}
function renderPickerList(q) {
  const list = $('pickerList'); list.innerHTML = '';
  const ql = q.toLowerCase().trim();
  // If a full address is typed, fetch and SHOW its live content as a rich card.
  if (/^0x[0-9a-fA-F]{40}$/.test(ql)) { renderSearchCard(ql); return; }
  const entries = Object.values(KNOWN);
  for (const k of Object.keys(state.tokens)) if (!(k in KNOWN)) entries.push(state.tokens[k]);
  const filtered = entries.filter(t => !ql || sym(t).toLowerCase().includes(ql) || (t.name || '').toLowerCase().includes(ql) || t.address.toLowerCase().includes(ql));
  for (const info of filtered) {
    const bal = state.balances[info.address.toLowerCase()] ?? '—';
    const el = document.createElement('div');
    el.className = 'opt';
    el.innerHTML = iconHTML(info) + `<div><div class="name">${sym(info)}</div><div class="sub">${info.name}</div></div>`
      + `<div class="r"><div>${bal}</div><div class="sub mono">${short(info.address)}</div></div>`;
    el.onclick = () => pick(info.address);
    list.appendChild(el);
  }
  if (!list.children.length) list.innerHTML = '<div class="empty">无匹配。粘贴完整合约地址以查看代币详情。</div>';
}
async function renderSearchCard(token) {
  const list = $('pickerList'), seq = ++state.pickerSeq;
  list.innerHTML = '<div class="srch-loading">正在读取代币链上与行情信息…</div>';
  // fetch metadata (name/decimals/balance) and GMGN info (logo/price/tax/risk) in parallel
  let meta = null, info = null;
  try {
    const [m, g] = await Promise.all([
      fetch('/meta?tokens=' + encodeURIComponent(token)).then(r => r.json()).catch(() => null),
      fetch('/tokeninfo?token=' + encodeURIComponent(token)).then(r => r.json()).catch(() => null),
    ]);
    if (seq !== state.pickerSeq) return;
    meta = m?.data?.tokens?.[token] || null;
    info = g?.success ? g.data : null;
  } catch {}
  if (seq !== state.pickerSeq) return;
  const name = info?.name || meta?.name || '未知代币';
  const symbol = info?.symbol || meta?.symbol || short(token);
  const bal = meta?.balance ?? state.balances[token] ?? '—';
  const logo = info?.logo || '';
  const d = info || {};
  const base6 = tokenInfoCells(d, token);
  const cells = [base6[0], base6[2], ['余额', bal]];
  const extraCells = [base6[1], base6[4], base6[5]];
  const card = document.createElement('div');
  card.className = 'srch-card';
  card.innerHTML =
    `<div class="srch-head"><span class="ic">${logo ? `<img src="${logo}" referrerpolicy="no-referrer" alt="">` : symbol.slice(0, 2).toUpperCase()}</span>`
    + `<div><div class="srch-name">${name} <span style="color:var(--muted);font-weight:500">· ${symbol}</span></div>`
    + `<div class="srch-sub mono">${token}${d.launchpad ? ' · ' + d.launchpad : ''}</div></div></div>`
    + `<div class="srch-grid">${[...cells, ...extraCells].map(([k, v]) => `<div class="c"><div class="k">${k}</div><div class="v">${v}</div></div>`).join('')}</div>`
    + (riskBadges(d).length ? `<div class="srch-badges">${riskBadges(d).map(([t, c]) => `<span class="badge ${c}">${t}</span>`).join('')}</div>` : '')
    + `<button class="srch-pick">选择 ${symbol}</button>`;
  // cache into known list so it appears next time and renders in balances
  state.tokens[token] = {address: token, name, symbol, symbolShort: symbol, decimals: meta?.decimals ?? 18, logo, cls: ''};
  KNOWN[token] = state.tokens[token];
  if (bal !== '—') state.balances[token] = bal;
  card.querySelector('.srch-pick').onclick = () => pick(token);
  list.innerHTML = ''; list.appendChild(card);
}
function pick(addr) {
  const other = state.picker === 'from' ? state.to : state.from;
  if (addr.toLowerCase() === other.toLowerCase()) { if (state.picker === 'from') state.to = state.from; else state.from = state.to; }
  if (state.picker === 'from') state.from = addr; else state.to = addr;
  $('picker').close(); afterPairChange();
}

// ---------- history / alerts (shared across views) ----------
function renderHistory(list, boxId) {
  const box = $(boxId); if (!box) return;
  if (!list.length) { box.innerHTML = '<div class="empty">暂无兑换记录</div>'; return; }
  box.innerHTML = '';
  const base = [BNB.toLowerCase(), USDT.toLowerCase()];
  for (const o of list) {
    const got = o.direct ? '' : (o.status === 'FINISHED' ? trim(o.toTokenActualQty) : '…');
    // the tradable (meme) side — whichever leg isn't BNB/USDT — is the CA worth copying
    const ca = [o.toToken, o.fromToken].find(a => a && !base.includes(a.toLowerCase())) || o.toToken || o.fromToken;
    const el = document.createElement('div'); el.className = 'li';
    const hu = o.status === 'FAILED' ? null : (usdOf(o.fromToken, o.fromTokenQty) ?? usdOf(o.toToken, o.toTokenActualQty));
    el.innerHTML = `<div style="min-width:0"><div class="pair-l">${trim(o.fromTokenQty)} ${o.fromTokenName} → ${got} ${o.toTokenName}${hu != null ? ` <span class="hu">${fmtUsd(hu)}</span>` : ''}${o.direct ? ` <span class="ptag">${PLATFORM_NAMES[o.platform] || o.platform}</span>` : ''}</div>`
      + `<div class="meta">${(o.bookTime || '').replace('T', ' ').slice(0, 19)}`
      + (o.txHash ? ` · <a href="https://bscscan.com/tx/${o.txHash}" target="_blank" rel="noopener">链上</a>` : '') + `</div></div>`
      + `<div style="display:flex;align-items:center;gap:8px;flex:none">`
      + (ca && !base.includes(ca.toLowerCase()) ? `<button class="copyca" title="复制该代币合约 / 双击载入兑换" data-ca="${ca}">复制CA</button>` : '')
      + (o.txHash ? `<a class="copyca hashlink" href="https://bscscan.com/tx/${o.txHash}" target="_blank" rel="noopener" title="${o.txHash}">Tx ↗</a>` : '')
      + `<span class="st st-${o.status}">${o.status}</span></div>`;
    box.appendChild(el);
  }
  for (const b of box.querySelectorAll('.copyca[data-ca]')) b.onclick = () => copyText(b.dataset.ca, b);
}
async function copyText(text, btn) {
  try { await navigator.clipboard.writeText(text); }
  catch { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); }
  const old = btn.textContent; btn.textContent = '已复制'; btn.classList.add('ok');
  setTimeout(() => { btn.textContent = old; btn.classList.remove('ok'); }, 1400);
}
// double-click a CA button loads that token straight into the swap's "receive" side
document.addEventListener('dblclick', e => {
  const b = e.target.closest?.('.copyca[data-ca]'); if (!b) return;
  state.to = b.dataset.ca; showView('swap'); afterPairChange();
});
async function loadHistory() {
  try {
    const x = await (await fetch('/orders')).json();
    if (!x.success) throw Error(x.error?.message || '读取失败');
    const merged = [...(x.data?.list || []), ...loadDirect()].sort((a, b) => String(b.bookTime).localeCompare(String(a.bookTime)));
    renderHistory(merged, 'hist'); renderHistory(merged, 'hist2');
  } catch (e) { const m = '<div class="empty">历史读取失败：' + e.message + '</div>'; if ($('hist')) $('hist').innerHTML = m; if ($('hist2')) $('hist2').innerHTML = m; }
}
function renderAlerts(list, boxId) {
  const box = $(boxId); if (!box) return;
  if (!list.length) { box.innerHTML = '<div class="empty">尚无买入/提醒事件</div>'; return; }
  box.innerHTML = '';
  for (const e of list.slice(0, 15)) {
    const t = new Date(e.ts).toLocaleString(), el = document.createElement('div'); el.className = 'li';
    if (e.type === 'bought')
      el.innerHTML = `<div><div class="pair-l">✅ 已买入 ${e.budgetBnb} BNB</div><div class="meta mono">${e.token}`
        + (e.tx ? ` · <a href="https://bscscan.com/tx/${e.tx}" target="_blank" rel="noopener">链上</a>` : '') + `</div><div class="meta">${t}</div></div><span class="st st-BOUGHT">BOUGHT</span>`;
    else if (e.type === 'tenx')
      el.innerHTML = `<div><div class="pair-l">🚀 到 ${e.mult}x</div><div class="meta mono">${e.token}</div><div class="meta">${t} · 可出本（卖出不自动）</div></div><span class="st st-10x">10x</span>`;
    else el.innerHTML = `<div><div class="pair-l">${e.type}</div><div class="meta mono">${e.token || ''}</div></div>`;
    box.appendChild(el);
  }
}
async function loadAlerts() {
  try {
    const x = await (await fetch('/events')).json();
    renderAlerts(x.data || [], 'alerts'); renderAlerts(x.data || [], 'alerts2');
  } catch {}
}

// ---------- monitor status ----------
async function loadStatus() {
  try {
    const x = await (await fetch('/status')).json();
    const live = x.data?.live, st = x.data?.status || {}, snipe = x.data?.kind === 'stock_snipe';
    const chip = $('monChip');
    chip.className = 'chip' + (live ? (st.armed ? ' armed' : ' live') : ' off');
    $('monChipText').textContent = live ? (st.armed ? '监控·实盘' : '监控·模拟') : '监控离线';
    const ring = $('monRing'); ring.className = 'mon-ring' + (live ? ' live' : '');
    $('monTitle') && ($('monTitle').textContent = snipe ? '股票底池狙击' : '抢购监控');
    $('monSub').textContent = !live ? '监控进程未运行'
      : snipe ? `Agent ID 模板 · 底池 ${(st.stocks || []).join(' / ')} · 钱包 ${short(st.wallet || '')}`
      : `${st.presetName || '模板'} · preset ${st.preset}`;
    $('monPills').innerHTML = live
      ? `<span class="pill ${st.armed ? 'arm' : 'dry'}">${st.armed ? '实盘' : '模拟'}</span><span class="pill on">运行中</span>`
      : `<span class="pill off">离线</span>`;
    const hb = st.ts ? new Date(st.ts).toLocaleTimeString() : '—';
    const stats = snipe ? [
      ['每个买入', Number(st.target || 0).toLocaleString() + ' 个（1%）', 'gold'],
      ['已买 / 上限', `${st.bought ?? 0} / ${st.max ?? '—'}`, ''],
      ['已转出', st.forwarded ?? 0, ''],
      ['命中 / 跳过', `${st.hits ?? 0} / ${st.skipped ?? 0}`, ''],
      ['最新区块', st.head ? st.head.toLocaleString() : '—', ''],
      ['轮询 · WSS', `${st.pollMs ?? '—'}ms · ${st.wss ?? 0} 路`, ''],
      ['转出地址', short(st.forwardTo || ''), ''],
      ['心跳', hb, ''],
    ] : [
      ['买入预算', (st.budgetBnb ?? '—') + ' BNB', 'gold'],
      ['最新区块', st.head ? st.head.toLocaleString() : '—', ''],
      ['已买入', st.bought ?? 0, ''],
      ['已跳过', st.skipped ?? 0, ''],
      ['WSS 连接', (st.wss ?? 0) + ' 路', ''],
      ['心跳', hb, ''],
    ];
    $('monStats').innerHTML = stats.map(([k, v, c]) => `<div class="c"><div class="k">${k}</div><div class="v ${c}">${v}</div></div>`).join('');
    const rec = $('monRecent');
    if (rec) rec.innerHTML = snipe && (st.recent || []).length
      ? st.recent.map(h => `<div class="li"><div><div class="pair-l">${h.sym} 底池 · ${h.result}</div><div class="meta mono">${short(h.token)}${h.reason ? ' · ' + h.reason : ''}</div></div>`
        + (h.tx && h.tx.startsWith('0x') ? `<a class="copyca hashlink" href="https://bscscan.com/tx/${h.tx}" target="_blank" rel="noopener">Tx ↗</a>` : '') + `</div>`).join('')
      : (snipe ? '<div class="empty">还没有命中股票底池的新币</div>' : '');
  } catch {
    $('monChip').className = 'chip off'; $('monChipText').textContent = '监控离线';
  }
}

// ---------- four preflight ----------
async function preflight() {
  const token = $('fourToken').value.trim(), out = $('fourOut');
  out.style.display = 'block';
  if (!/^0x[0-9a-fA-F]{40}$/.test(token)) { out.textContent = '请输入有效的合约地址'; return; }
  out.textContent = '正在只读核查模板、Agent ID NFT 与白名单…';
  try {
    const x = await (await fetch('/four/preflight', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({token})})).json();
    if (!x.success) throw Error(x.error?.message || '检查失败');
    const d = x.data;
    out.textContent = ['模板：' + (d.template || d.protocol || '未知'), '钱包：' + d.wallet,
      'Agent ID NFT 识别：' + (d.agentRecognized ? '是' : '否'), '交易入口：' + (d.core || d.manager || '未识别'), d.blocker || ''].filter(Boolean).join('\n');
  } catch (e) { out.textContent = '检查失败：' + e.message; }
}

// ---------- boot ----------
function bootstrap() {
  drawBlockies('0x0000000000000000000000000000000000000000');
  renderTokButtons(); renderPairs();
  $('fromAmt').addEventListener('input', () => { state.allSelected = false; scheduleQuote(); });
  $('slipCustom').addEventListener('input', () => {
    const v = $('slipCustom').value.trim();
    if (v && parseFloat(v) > 0 && parseFloat(v) <= 100) { state.slippage = v; [...$('slipSeg').children].forEach(b => b.classList.remove('on')); $('slipLabel').textContent = v + '%'; scheduleQuote(); }
  });
  $('pickerInput').addEventListener('input', e => renderPickerList(e.target.value.trim()));
  $('picker').addEventListener('click', e => { if (e.target === $('picker')) $('picker').close(); });
  loadWallet(); loadHistory(); loadStatus(); loadAlerts(); loadBnbPrice();
  setInterval(loadBnbPrice, 30000);
  setInterval(loadStatus, 6000);
  setInterval(loadAlerts, 8000);
}
window.bootstrap = bootstrap;
Object.assign(window, {toggleSettings, setSlip, setGas, openPicker, flip, usePct, doSwap, loadWallet, loadHistory, loadAlerts, preflight});
