// ===== CATEGORIES =====
const CATEGORIES = [
  { id: 'food',          label: 'Food',          icon: '🍽️', color: '#e07e5c' },
  { id: 'transport',     label: 'Transport',      icon: '🚗', color: '#5c9ae0' },
  { id: 'housing',       label: 'Housing',        icon: '🏠', color: '#9a7ee0' },
  { id: 'health',        label: 'Health',         icon: '💊', color: '#5cbe8a' },
  { id: 'entertainment', label: 'Entertainment',  icon: '🎮', color: '#e05c5c' },
  { id: 'shopping',      label: 'Shopping',       icon: '🛍️', color: '#5cd4c4' },
  { id: 'education',     label: 'Education',      icon: '📚', color: '#c9a84c' },
  { id: 'salary',        label: 'Salary',         icon: '💼', color: '#5cbe8a' },
  { id: 'freelance',     label: 'Freelance',      icon: '💻', color: '#5cd4c4' },
  { id: 'investment',    label: 'Investment',     icon: '📈', color: '#c9a84c' },
  { id: 'other',         label: 'Other',          icon: '📌', color: '#7a7570' },
];

// ===== STATE =====
let transactions = JSON.parse(localStorage.getItem('ledger_tx') || '[]');
let budgets      = JSON.parse(localStorage.getItem('ledger_budgets') || '{}');
let currentType  = 'expense';
let selectedCat  = 'food';

// ===== PERSIST =====
function save() {
  localStorage.setItem('ledger_tx', JSON.stringify(transactions));
  localStorage.setItem('ledger_budgets', JSON.stringify(budgets));
}

// ===== FORMAT CURRENCY (Philippine Peso) =====
function fmt(n) {
  return '₱' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ===== INIT =====
function init() {
  // Header date
  const now = new Date();
  document.getElementById('headerDate').innerHTML =
    `${now.toLocaleDateString('en-PH', { weekday: 'long' })}<br>` +
    `${now.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}`;

  // Default date input to today
  document.getElementById('txDate').value = now.toISOString().split('T')[0];

  // Build category filter dropdown
  const filterCat = document.getElementById('filterCat');
  CATEGORIES.forEach(c => {
    const o = document.createElement('option');
    o.value = c.id;
    o.textContent = c.label;
    filterCat.appendChild(o);
  });

  renderCatPills();
  renderAll();
}

// ===== CATEGORY PILLS =====
function renderCatPills() {
  const container = document.getElementById('catPills');
  container.innerHTML = '';

  const cats = currentType === 'expense'
    ? CATEGORIES.filter(c => !['salary', 'freelance', 'investment'].includes(c.id))
    : CATEGORIES.filter(c => ['salary', 'freelance', 'investment', 'other'].includes(c.id));

  // Auto-select first available category for current type
  if (!cats.find(c => c.id === selectedCat)) {
    selectedCat = cats[0].id;
  }

  cats.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'cat-pill' + (c.id === selectedCat ? ' active' : '');
    btn.innerHTML = `${c.icon} ${c.label}`;
    btn.onclick = () => {
      selectedCat = c.id;
      renderCatPills();
    };
    container.appendChild(btn);
  });
}

// ===== TYPE TOGGLE =====
function setType(t) {
  currentType = t;
  document.getElementById('btnExpense').className = 'type-btn' + (t === 'expense' ? ' active-expense' : '');
  document.getElementById('btnIncome').className  = 'type-btn' + (t === 'income'  ? ' active-income'  : '');
  document.getElementById('formTypeBadge').textContent = t.toUpperCase();
  renderCatPills();
}

// ===== ADD TRANSACTION =====
function addTransaction() {
  const name   = document.getElementById('txName').value.trim();
  const amount = parseFloat(document.getElementById('txAmount').value);
  const date   = document.getElementById('txDate').value;
  const note   = document.getElementById('txNote').value.trim();

  if (!name)              { showToast('Enter a description'); return; }
  if (!amount || amount <= 0) { showToast('Enter a valid amount'); return; }
  if (!date)              { showToast('Select a date'); return; }

  transactions.unshift({
    id: Date.now(),
    name,
    amount,
    date,
    note,
    type: currentType,
    category: selectedCat,
  });

  save();
  renderAll();
  showToast(currentType === 'expense'
    ? `Expense added: ${fmt(amount)}`
    : `Income added: ${fmt(amount)}`
  );

  // Reset form fields
  document.getElementById('txName').value   = '';
  document.getElementById('txAmount').value = '';
  document.getElementById('txNote').value   = '';
  document.getElementById('txDate').value   = new Date().toISOString().split('T')[0];
}

// ===== RENDER ALL =====
function renderAll() {
  renderStats();
  renderTransactions();
  renderChart();
  renderCatBreakdown();
  renderBudgets();
}

// ===== STATS =====
function renderStats() {
  const totalExp = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalInc = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const balance  = totalInc - totalExp;
  const savings  = totalInc > 0 ? Math.round(((totalInc - totalExp) / totalInc) * 100) : 0;

  const now       = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const mExp = transactions.filter(t => t.type === 'expense' && t.date.startsWith(thisMonth)).length;
  const mInc = transactions.filter(t => t.type === 'income'  && t.date.startsWith(thisMonth)).length;

  const balEl = document.getElementById('statBalance');
  balEl.textContent = fmt(Math.abs(balance));
  balEl.className   = 'stat-value' + (balance >= 0 ? ' positive' : ' negative');
  if (balance < 0) balEl.textContent = '-' + balEl.textContent;

  document.getElementById('statExpenses').textContent = fmt(totalExp);
  document.getElementById('statIncome').textContent   = fmt(totalInc);
  document.getElementById('statSavings').textContent  = savings + '%';
  document.getElementById('statTxCount').textContent  = transactions.length + ' transactions';
  document.getElementById('statExpCount').textContent = mExp + ' this month';
  document.getElementById('statIncCount').textContent = mInc + ' this month';
  document.getElementById('txCountBadge').textContent = transactions.length;
}

// ===== TRANSACTIONS =====
function renderTransactions() {
  const list   = document.getElementById('txList');
  const search = document.getElementById('searchInput').value.toLowerCase();
  const fType  = document.getElementById('filterType').value;
  const fCat   = document.getElementById('filterCat').value;

  const filtered = transactions.filter(t => {
    if (search && !t.name.toLowerCase().includes(search) && !(t.note || '').toLowerCase().includes(search)) return false;
    if (fType && t.type !== fType) return false;
    if (fCat  && t.category !== fCat)  return false;
    return true;
  });

  if (!filtered.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="big-icon">◎</div>
        <p>${transactions.length ? 'No matching transactions' : 'No transactions yet'}</p>
      </div>`;
    return;
  }

  list.innerHTML = filtered.map(t => {
    const cat     = CATEGORIES.find(c => c.id === t.category) || CATEGORIES.at(-1);
    const d       = new Date(t.date + 'T00:00:00');
    const dateStr = d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
    return `
      <div class="tx-item">
        <div class="tx-icon">${cat.icon}</div>
        <div class="tx-info">
          <div class="tx-name">
            ${t.name}
            ${t.note ? `<span class="tx-note">— ${t.note}</span>` : ''}
          </div>
          <div class="tx-meta">
            <span class="tx-cat" style="border-color:${cat.color}30;color:${cat.color};">${cat.label}</span>
            <span class="tx-date">${dateStr}</span>
          </div>
        </div>
        <div class="tx-amount ${t.type}">${t.type === 'expense' ? '-' : '+'}${fmt(t.amount)}</div>
        <button class="tx-del" onclick="deleteTransaction(${t.id})">✕</button>
      </div>`;
  }).join('');
}

function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  save();
  renderAll();
  showToast('Transaction removed');
}

function clearAll() {
  if (!transactions.length) return;
  if (confirm('Clear all transactions?')) {
    transactions = [];
    save();
    renderAll();
    showToast('All transactions cleared');
  }
}

// ===== MONTHLY CHART =====
function renderChart() {
  const container = document.getElementById('chartBars');
  const now    = new Date();
  const months = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key:   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-PH', { month: 'short' }),
    });
  }

  const data = months.map(m => ({
    label: m.label,
    exp: transactions.filter(t => t.type === 'expense' && t.date.startsWith(m.key)).reduce((s, t) => s + t.amount, 0),
    inc: transactions.filter(t => t.type === 'income'  && t.date.startsWith(m.key)).reduce((s, t) => s + t.amount, 0),
  }));

  const maxVal = Math.max(...data.map(d => Math.max(d.exp, d.inc)), 1);

  container.innerHTML = data.map(d => {
    const expH = Math.round((d.exp / maxVal) * 100);
    const incH = Math.round((d.inc / maxVal) * 100);
    return `
      <div class="chart-bar-group">
        <div class="bar-wrap">
          <div class="bar expense-bar" style="height:${expH}%" title="Expenses: ${fmt(d.exp)}"></div>
          <div class="bar income-bar"  style="height:${incH}%" title="Income: ${fmt(d.inc)}"></div>
        </div>
        <div class="bar-label">${d.label}</div>
      </div>`;
  }).join('');
}

// ===== CATEGORY BREAKDOWN =====
function renderCatBreakdown() {
  const container = document.getElementById('catBreakdown');
  const expCats   = {};

  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => { expCats[t.category] = (expCats[t.category] || 0) + t.amount; });

  const sorted = Object.entries(expCats).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxVal = sorted[0]?.[1] || 1;

  if (!sorted.length) {
    container.innerHTML = '<div class="empty-label">No expense data</div>';
    return;
  }

  container.innerHTML = sorted.map(([id, amt]) => {
    const cat = CATEGORIES.find(c => c.id === id) || CATEGORIES.at(-1);
    const pct = Math.round((amt / maxVal) * 100);
    return `
      <div class="cat-row">
        <div class="cat-row-icon">${cat.icon}</div>
        <div class="cat-row-info">
          <div class="cat-row-name">${cat.label}</div>
          <div class="cat-bar-bg">
            <div class="cat-bar-fill" style="width:${pct}%;background:${cat.color};"></div>
          </div>
        </div>
        <div class="cat-row-amt">${fmt(amt)}</div>
      </div>`;
  }).join('');
}

// ===== BUDGET MODAL =====
function openBudgetModal() {
  const expCats   = CATEGORIES.filter(c => !['salary', 'freelance', 'investment'].includes(c.id));
  const container = document.getElementById('budgetInputs');

  container.innerHTML = expCats.map(c => `
    <div class="budget-input-row">
      <span>${c.icon}</span>
      <label style="font-family:'Inter',sans-serif;font-size:11px;font-weight:500;color:var(--text-muted);width:100px;text-transform:uppercase;letter-spacing:0.5px;">${c.label}</label>
      <input
        type="number"
        id="budget_${c.id}"
        value="${budgets[c.id] || ''}"
        placeholder="No limit"
        min="0"
      />
    </div>`).join('');

  document.getElementById('budgetModal').classList.add('open');
}

function closeBudgetModal() {
  document.getElementById('budgetModal').classList.remove('open');
}

function saveBudgets() {
  const expCats = CATEGORIES.filter(c => !['salary', 'freelance', 'investment'].includes(c.id));
  expCats.forEach(c => {
    const val = parseFloat(document.getElementById('budget_' + c.id).value);
    if (val > 0) budgets[c.id] = val;
    else delete budgets[c.id];
  });
  save();
  renderBudgets();
  closeBudgetModal();
  showToast('Budgets saved');
}

// ===== BUDGET DISPLAY =====
function renderBudgets() {
  const container = document.getElementById('budgetSection');
  const now       = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const items     = Object.entries(budgets);

  if (!items.length) {
    container.innerHTML = '<div class="empty-label">Click EDIT to set budgets</div>';
    return;
  }

  container.innerHTML = items.map(([catId, limit]) => {
    const cat = CATEGORIES.find(c => c.id === catId);
    if (!cat) return '';

    const spent = transactions
      .filter(t => t.type === 'expense' && t.category === catId && t.date.startsWith(thisMonth))
      .reduce((s, t) => s + t.amount, 0);

    const pct = Math.min(100, Math.round((spent / limit) * 100));
    const cls = pct >= 100 ? 'over' : pct >= 75 ? 'warn' : 'ok';

    return `
      <div class="budget-item">
        <div class="budget-header">
          <div class="budget-name">${cat.icon} ${cat.label}</div>
          <div class="budget-amounts">${fmt(spent)} / ${fmt(limit)}</div>
        </div>
        <div class="budget-bar-bg">
          <div class="budget-bar-fill ${cls}" style="width:${pct}%"></div>
        </div>
      </div>`;
  }).join('');
}

// ===== TOAST =====
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

// ===== MODAL BACKDROP CLOSE =====
document.getElementById('budgetModal').addEventListener('click', function (e) {
  if (e.target === this) closeBudgetModal();
});

// ===== START =====
init();