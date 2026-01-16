let state = {
  cryptos: [],   
  portfolios: [] 
};

const LS_KEY = "cryptofolio_state";


const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
function toast(msg) {
  const t = $("#toast");
  $("#toast-msg").textContent = msg;
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 1800);
}
function saveState() { localStorage.setItem(LS_KEY, JSON.stringify(state)); }
function loadState() {
  const data = localStorage.getItem(LS_KEY);
  if (data) {
    state = JSON.parse(data);
  } else {
    state.portfolios = [{ id: Date.now(), name: "Portefeuille principal" }];
  }
}
document.addEventListener("DOMContentLoaded", () => {
  loadState();
  initNavigation();
  initTheme();
  initGlobalSearch();
  renderPortfolios();
  renderCryptos();
  initForms();
  initSearchAndSort();
  initDashboard();
  initTopMarket();
  $("#clear-storage").addEventListener("click", () => {
    localStorage.removeItem(LS_KEY);
    state = { cryptos: [], portfolios: [{ id: Date.now(), name: "Portefeuille principal" }] };
    renderPortfolios(); renderCryptos(); updateDashboard(); updatePieChart();
    toast("Données réinitialisées");
  });
});

function initNavigation() {
  const buttons = $$(".nav-btn");
  const sections = $$(".page-section");
  const pageTitle = $("#page-title");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.dataset.target;
      sections.forEach(sec => sec.classList.toggle("hidden", sec.id !== target));
      if (target === "dashboard") pageTitle.textContent = "Dashboard";
      if (target === "module1") pageTitle.textContent = "Actifs Crypto";
      if (target === "module2") pageTitle.textContent = "Portefeuilles";
    });
  });
}

function initTheme() {
  $("#toggle-theme").addEventListener("click", () => {
    document.body.classList.toggle("light");
  });
}

function initGlobalSearch() {
  $("#global-search").addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = state.cryptos.filter(c =>
      c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)
    );
    renderCryptos(filtered);
  });
}

function renderPortfolios() {
  const list = $("#portfolio-list");
  list.innerHTML = "";
  state.portfolios.forEach(p => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${p.name}</span>
      <div class="actions">
        <button class="ghost" onclick="deletePortfolio(${p.id})"><i class="fa-solid fa-trash"></i> Supprimer</button>
      </div>
    `;
    list.appendChild(li);
  });

  const select = $("#crypto-portfolio");
  select.innerHTML = "";
  state.portfolios.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name;
    select.appendChild(opt);
  });
}

function deletePortfolio(id) {
  const used = state.cryptos.some(c => c.portfolioId === id);
  if (used) { toast("Portefeuille utilisé par des actifs"); return; }

  state.portfolios = state.portfolios.filter(p => p.id !== id);
  saveState(); renderPortfolios(); updatePieChart();
  toast("Portefeuille supprimé");
}

function initForms() {
  
  const portfolioForm = $("#portfolio-form");
  portfolioForm.addEventListener("submit", e => {
    e.preventDefault();
    const nameInput = $("#portfolio-name");
    const name = nameInput.value.trim();
    if (!name) return;

    state.portfolios.push({ id: Date.now(), name });
    nameInput.value = "";
    saveState(); renderPortfolios(); updatePieChart();
    toast("Portefeuille ajouté");
  });

  const cryptoForm = $("#crypto-form");
  cryptoForm.addEventListener("submit", e => {
    e.preventDefault();
    const idField = $("#crypto-id");
    const name = $("#crypto-name").value.trim();
    const symbol = $("#crypto-symbol").value.trim().toUpperCase();
    const qty = parseFloat($("#crypto-qty").value);
    const buyPrice = parseFloat($("#crypto-buy-price").value);
    const portfolioId = parseInt($("#crypto-portfolio").value);

    if (!name || !symbol || isNaN(qty) || isNaN(buyPrice)) return;

    if (idField.value) {
      const id = parseInt(idField.value);
      const c = state.cryptos.find(c => c.id === id);
      if (c) {
        c.name = name; c.symbol = symbol; c.qty = qty; c.buyPrice = buyPrice; c.portfolioId = portfolioId;
      }
      toast("Actif modifié");
    } else {
      state.cryptos.push({ id: Date.now(), name, symbol, qty, buyPrice, portfolioId });
      toast("Actif ajouté");
    }

    cryptoForm.reset(); idField.value = "";
    saveState(); renderCryptos(); updateDashboard(); updatePieChart();
  });
}

function renderCryptos(filtered = null) {
  const tbody = $("#crypto-table-body");
  tbody.innerHTML = "";

  const items = filtered || state.cryptos;
  items.forEach(c => {
    const current = getCurrentPrice(c.symbol) || c.buyPrice;
    const value = c.qty * current;
    const gainPct = current ? ((current - c.buyPrice) / c.buyPrice) * 100 : 0;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><button class="ghost" onclick="openDetail(${c.id})">${c.name}</button></td>
      <td>${c.symbol}</td>
      <td>${c.qty}</td>
      <td>$${c.buyPrice.toFixed(2)}</td>
      <td>$${current.toFixed(2)}</td>
      <td>$${value.toFixed(2)}</td>
      <td style="color:${gainPct >= 0 ? 'var(--success)' : 'var(--danger)'}">${gainPct.toFixed(2)}%</td>
      <td>
        <button class="ghost" onclick="editCrypto(${c.id})"><i class="fa-solid fa-pen"></i></button>
        <button class="ghost" onclick="deleteCrypto(${c.id})"><i class="fa-solid fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function editCrypto(id) {
  const c = state.cryptos.find(c => c.id === id);
  if (!c) return;
  $("#crypto-id").value = c.id;
  $("#crypto-name").value = c.name;
  $("#crypto-symbol").value = c.symbol;
  $("#crypto-qty").value = c.qty;
  $("#crypto-buy-price").value = c.buyPrice;
  $("#crypto-portfolio").value = c.portfolioId;
}

function deleteCrypto(id) {
  if (!confirm("Supprimer cet actif ?")) return;
  state.cryptos = state.cryptos.filter(c => c.id !== id);
  saveState(); renderCryptos(); updateDashboard(); updatePieChart();
  toast("Actif supprimé");
}


function openDetail(id) {
  const c = state.cryptos.find(c => c.id === id);
  if (!c) return;
  $("#detail-title").textContent = `${c.name} (${c.symbol})`;
  const current = getCurrentPrice(c.symbol) || c.buyPrice;
  $("#detail-body").innerHTML = `
    <div>
      <p><strong>Quantité:</strong> ${c.qty}</p>
      <p><strong>Prix d'achat:</strong> $${c.buyPrice.toFixed(2)}</p>
      <p><strong>Prix actuel (API):</strong> $${current.toFixed(2)}</p>
      <p><strong>Valeur actuelle:</strong> $${(current * c.qty).toFixed(2)}</p>
      <p><strong>Gain (%):</strong> ${(((current - c.buyPrice)/c.buyPrice)*100).toFixed(2)}%</p>
    </div>
    <div>
      <canvas id="miniChart" height="100"></canvas>
    </div>
  `;
  $("#crypto-detail-modal").classList.remove("hidden");
  $("#close-detail").onclick = () => $("#crypto-detail-modal").classList.add("hidden");

  fetchSparkline(c.symbol.toLowerCase(), "usd", 7).then(values => {
    const ctx = $("#miniChart");
    new Chart(ctx, {
      type: "line",
      data: { labels: values.map((_, i) => i+1), datasets: [{ data: values, borderColor: getColor(values), tension: .3 }] },
      options: { plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }
    });
  }).catch(() => {});
}
function initSearchAndSort() {
  const searchInput = $("#crypto-search");
  const sortSelect = $("#crypto-sort");

  function applyFilters() {
    let list = [...state.cryptos];
    const q = searchInput.value.toLowerCase();

    if (q) {
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)
      );
    }

    if (sortSelect.value === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortSelect.value === "value") {
      list.sort((a, b) => (b.qty * (getCurrentPrice(b.symbol) || b.buyPrice)) - (a.qty * (getCurrentPrice(a.symbol) || a.buyPrice)));
    } else if (sortSelect.value === "gain") {
      list.sort((a, b) => {
        const ca = (getCurrentPrice(a.symbol) || a.buyPrice);
        const cb = (getCurrentPrice(b.symbol) || b.buyPrice);
        return ((cb - b.buyPrice) / b.buyPrice) - ((ca - a.buyPrice) / a.buyPrice);
      });
    }

    renderCryptos(list);
  }

  searchInput.addEventListener("input", applyFilters);
  sortSelect.addEventListener("change", applyFilters);
}


let btcChart = null;
let pieChart = null;
let priceCache = {}; 

function initDashboard() {

  btcChart = new Chart($("#btcChart"), {
    type: "line",
    data: { labels: [], datasets: [{ label: "BTC (USD)", data: [], borderColor: "#f59e0b", tension: .3 }] },
    options: { responsive: true, scales: { y: { beginAtZero: false } } }
  });

  pieChart = new Chart($("#pieChart"), {
    type: "doughnut",
    data: { labels: [], datasets: [{ data: [], backgroundColor: ["#2563eb","#22c55e","#ef4444","#f59e0b","#a855f7","#14b8a6"] }] },
    options: { plugins: { legend: { position: "bottom" } } }
  });

  fetchBtcHistory();
  refreshPrices().then(() => {
    updateDashboard();
    updatePieChart();
    renderCryptos();
  });
}

function updatePieChart() {
  const totalsByPortfolio = {};
  state.portfolios.forEach(p => totalsByPortfolio[p.id] = 0);
  state.cryptos.forEach(c => {
    const current = getCurrentPrice(c.symbol) || c.buyPrice;
    totalsByPortfolio[c.portfolioId] = (totalsByPortfolio[c.portfolioId] || 0) + current * c.qty;
  });

  const labels = state.portfolios.map(p => p.name);
  const values = state.portfolios.map(p => totalsByPortfolio[p.id] || 0);

  pieChart.data.labels = labels;
  pieChart.data.datasets[0].data = values;
  pieChart.update();
}

function updateDashboard() {
  let totalValue = 0;
  let topName = "—";
  let topGain = -Infinity;

  state.cryptos.forEach(c => {
    const current = getCurrentPrice(c.symbol) || c.buyPrice;
    totalValue += c.qty * current;
    const gainPct = ((current - c.buyPrice) / c.buyPrice) * 100;
    if (gainPct > topGain) { topGain = gainPct; topName = `${c.name} (${gainPct.toFixed(2)}%)`; }
  });

  $("#kpi-total-value").textContent = "$" + totalValue.toFixed(2);
  $("#kpi-top-asset").textContent = topName || "—";
  let totalCost = 0;
  state.cryptos.forEach(c => { totalCost += c.qty * c.buyPrice; });
  const pl = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;
  $("#kpi-profit-loss").textContent = `${pl.toFixed(2)} %`;
}

async function fetchBtcHistory() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=7");
    const data = await res.json();
    const prices = data.prices || [];
    const labels = prices.map(p => {
      const d = new Date(p[0]);
      return `${d.getDate()}/${d.getMonth()+1}`;
    });
    const values = prices.map(p => p[1]);

    btcChart.data.labels = labels;
    btcChart.data.datasets[0].data = values;
    btcChart.update();
  } catch (e) { console.error("Erreur API BTC:", e); }
}

async function refreshPrices() {

  const symbols = [...new Set(state.cryptos.map(c => c.symbol.toLowerCase()))];
  if (symbols.length === 0) return;

  const symbolToId = {
    btc: "bitcoin",
    eth: "ethereum",
    ada: "cardano",
    sol: "solana",
    xrp: "ripple",
    doge: "dogecoin",
    bnb: "binancecoin",
    matic: "polygon",
    dot: "polkadot",
    ltc: "litecoin"
  };

  const ids = symbols.map(s => symbolToId[s]).filter(Boolean);
  if (ids.length === 0) return;

  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=usd`;
    const res = await fetch(url);
    const data = await res.json();
    Object.entries(symbolToId).forEach(([sym, id]) => {
      if (data[id]?.usd) priceCache[sym.toUpperCase()] = data[id].usd;
    });
  } catch (e) { console.error("Erreur prix:", e); }
}

function getCurrentPrice(symbolUpper) {
  return priceCache[symbolUpper.toUpperCase()];
}

async function fetchSparkline(symbolLower, vs = "usd", days = 7) {
  const symbolToId = {
    btc: "bitcoin",
    eth: "ethereum",
    ada: "cardano",
    sol: "solana",
    xrp: "ripple",
    doge: "dogecoin",
    bnb: "binancecoin",
    matic: "polygon",
    dot: "polkadot",
    ltc: "litecoin"
  };
  const id = symbolToId[symbolLower];
  if (!id) return [];
  const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=${vs}&days=${days}`;
  const res = await fetch(url);
  const data = await res.json();
  return (data.prices || []).map(p => p[1]);
}

function getColor(values) {
  if (!values.length) return "#2563eb";
  const first = values[0], last = values[values.length-1];
  return last >= first ? "#22c55e" : "#ef4444";
}


function initTopMarket() {
  $("#refresh-top").addEventListener("click", loadTopMarket);
  loadTopMarket();
}
async function loadTopMarket() {
  const wrap = $("#top-market");
  wrap.innerHTML = "";
  try {
    const url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=5&page=1&sparkline=false";
    const res = await fetch(url);
    const data = await res.json();
    data.forEach(item => {
      const div = document.createElement("div");
      const changeClass = item.price_change_percentage_24h >= 0 ? "up" : "down";
      div.className = "top-tile";
      div.innerHTML = `
        <div class="name">${item.name} (${item.symbol.toUpperCase()})</div>
        <div class="price">$${item.current_price.toLocaleString()}</div>
        <div class="change ${changeClass}">${item.price_change_percentage_24h?.toFixed(2)}%</div>
      `;
      wrap.appendChild(div);
    });
  } catch (e) {
    wrap.innerHTML = "<p>Erreur de chargement du marché.</p>";
  }
}
