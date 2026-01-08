let cryptos = JSON.parse(localStorage.getItem("cryptos")) || [];
let portfolios = JSON.parse(localStorage.getItem("portfolios")) || [];
const cryptoForm = document.getElementById("crypto-form");
const cryptoTableBody = document.getElementById("crypto-table-body");

const nameInput = document.getElementById("crypto-name");
const symbolInput = document.getElementById("crypto-symbol");
const qtyInput = document.getElementById("crypto-qty");
const buyPriceInput = document.getElementById("crypto-buy-price");
const portfolioSelect = document.getElementById("crypto-portfolio");
const cryptoIdInput = document.getElementById("crypto-id");

const cryptoSearch = document.getElementById("crypto-search");
const cryptoSort = document.getElementById("crypto-sort");

const portfolioForm = document.getElementById("portfolio-form");
const portfolioNameInput = document.getElementById("portfolio-name");
const portfolioList = document.getElementById("portfolio-list");
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".page-section").forEach(sec => sec.classList.add("hidden"));
    document.getElementById(btn.dataset.target).classList.remove("hidden");
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("page-title").textContent = btn.textContent;
  });
});
cryptoForm.addEventListener("submit", e => {
  e.preventDefault();
  const id = cryptoIdInput.value;

  if (id) {
    const crypto = cryptos.find(c => c.id == id);
    crypto.name = nameInput.value;
    crypto.symbol = symbolInput.value.toUpperCase();
    crypto.quantity = parseFloat(qtyInput.value);
    crypto.buyPrice = parseFloat(buyPriceInput.value);
    crypto.portfolio = portfolioSelect.value;
  } else {
    cryptos.push({
      id: Date.now(),
      name: nameInput.value,
      symbol: symbolInput.value.toUpperCase(),
      quantity: parseFloat(qtyInput.value),
      buyPrice: parseFloat(buyPriceInput.value),
      portfolio: portfolioSelect.value
    });
  }
  localStorage.setItem("cryptos", JSON.stringify(cryptos));

  cryptoForm.reset();
  cryptoIdInput.value = "";
  renderCryptos();
});
function renderCryptos(list = cryptos) {
  cryptoTableBody.innerHTML = "";
  list.forEach(c => {
    const totalValue = (c.quantity * c.buyPrice).toFixed(2);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${c.name}</td>
      <td>${c.symbol}</td>
      <td>${c.quantity}</td>
      <td>$${c.buyPrice}</td>
      <td>$${totalValue}</td>
      <td>
        <button onclick="editCrypto(${c.id})">✏️</button>
        <button onclick="deleteCrypto(${c.id})">🗑</button>
      </td>
    `;
    cryptoTableBody.appendChild(tr);
  });
}
cryptoSearch.addEventListener("input", e => {
  const keyword = e.target.value.toLowerCase();
  const filtered = cryptos.filter(c =>
    c.name.toLowerCase().includes(keyword) ||
    c.symbol.toLowerCase().includes(keyword)
  );
  renderCryptos(filtered);
});
cryptoSort.addEventListener("change", e => {
  let sorted = [...cryptos];
  if (e.target.value === "name") {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    sorted.sort((a, b) => b.quantity * b.buyPrice - a.quantity * a.buyPrice);
  }
  renderCryptos(sorted);
});
function editCrypto(id) {
  const c = cryptos.find(c => c.id === id);
  cryptoIdInput.value = c.id;
  nameInput.value = c.name;
  symbolInput.value = c.symbol;
  qtyInput.value = c.quantity;
  buyPriceInput.value = c.buyPrice;
  portfolioSelect.value = c.portfolio;
}
function deleteCrypto(id) {
  if (confirm("Voulez-vous vraiment supprimer cet actif ?")) {
    cryptos = cryptos.filter(c => c.id !== id);
    localStorage.setItem("cryptos", JSON.stringify(cryptos));
    renderCryptos();
  }
}
portfolioForm.addEventListener("submit", e => {
  e.preventDefault();
  portfolios.push(portfolioNameInput.value);
  portfolioNameInput.value = "";
  localStorage.setItem("portfolios", JSON.stringify(portfolios));
  renderPortfolios();
  updatePortfolioSelect();
});
function renderPortfolios() {
  portfolioList.innerHTML = "";
  portfolios.forEach((p, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${p}
      <button onclick="deletePortfolio(${i})">🗑</button>
    `;
    portfolioList.appendChild(li);
  });
}
function deletePortfolio(index) {
  if (confirm("Supprimer ce portefeuille ?")) {
    portfolios.splice(index, 1);
    localStorage.setItem("portfolios", JSON.stringify(portfolios));
    renderPortfolios();
    updatePortfolioSelect();
  }
}
function updatePortfolioSelect() {
  portfolioSelect.innerHTML = `<option value="">Sélectionner</option>`;
  portfolios.forEach(p => {
    const option = document.createElement("option");
    option.value = p;
    option.textContent = p;
    portfolioSelect.appendChild(option);
  });
}
renderPortfolios();
updatePortfolioSelect();
renderCryptos();
