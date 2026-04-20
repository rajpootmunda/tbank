// ═══════════════════════════════════════════════
//  TBank — Database Layer (localStorage)
// ═══════════════════════════════════════════════

const DB = {

  // ── Users ──────────────────────────────────────
  getUsers() {
    return JSON.parse(localStorage.getItem('tbank_users') || '[]');
  },

  saveUsers(users) {
    localStorage.setItem('tbank_users', JSON.stringify(users));
  },

  createUser(name, phone, pin) {
    const users = this.getUsers();
    if (users.find(u => u.phone === phone)) return { ok: false, msg: 'Phone already registered.' };
    const user = {
      id: 'U' + Date.now(),
      name,
      phone,
      pin,
      balance: 0,
      createdAt: new Date().toISOString()
    };
    users.push(user);
    this.saveUsers(users);
    return { ok: true, user };
  },

  loginUser(phone, pin) {
    const users = this.getUsers();
    const user = users.find(u => u.phone === phone && u.pin === pin);
    if (!user) return { ok: false, msg: 'Invalid phone or PIN.' };
    sessionStorage.setItem('tbank_session', user.id);
    return { ok: true, user };
  },

  logout() {
    sessionStorage.removeItem('tbank_session');
  },

  currentUser() {
    const id = sessionStorage.getItem('tbank_session');
    if (!id) return null;
    return this.getUsers().find(u => u.id === id) || null;
  },

  requireLogin() {
    if (!this.currentUser()) {
      window.location.href = 'index.html';
    }
  },

  updateBalance(userId, newBalance) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) return false;
    users[idx].balance = newBalance;
    this.saveUsers(users);
    return true;
  },

  // ── Transactions ───────────────────────────────
  getTransactions(userId) {
    const all = JSON.parse(localStorage.getItem('tbank_txns') || '[]');
    return all.filter(t => t.userId === userId).sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  addTransaction(userId, type, amount, description) {
    const all = JSON.parse(localStorage.getItem('tbank_txns') || '[]');
    const user = this.currentUser();
    const txn = {
      id: 'T' + Date.now(),
      userId,
      type,          // 'deposit' | 'withdraw'
      amount,
      description,
      balanceAfter: user ? user.balance : 0,
      date: new Date().toISOString()
    };
    all.push(txn);
    localStorage.setItem('tbank_txns', JSON.stringify(all));
    return txn;
  },

  // ── Deposit ────────────────────────────────────
  deposit(amount, description) {
    const user = this.currentUser();
    if (!user) return { ok: false, msg: 'Not logged in.' };
    if (amount <= 0) return { ok: false, msg: 'Amount must be positive.' };
    const newBal = user.balance + amount;
    this.updateBalance(user.id, newBal);
    // Refresh user reference
    const updated = this.currentUser();
    updated.balance = newBal;
    this.addTransaction(user.id, 'deposit', amount, description || 'Cash Deposit');
    return { ok: true, balance: newBal };
  },

  // ── Withdraw ───────────────────────────────────
  withdraw(amount, description) {
    const user = this.currentUser();
    if (!user) return { ok: false, msg: 'Not logged in.' };
    if (amount <= 0) return { ok: false, msg: 'Amount must be positive.' };
    if (amount > user.balance) return { ok: false, msg: 'Insufficient balance.' };
    const newBal = user.balance - amount;
    this.updateBalance(user.id, newBal);
    this.addTransaction(user.id, 'withdraw', amount, description || 'Cash Withdrawal');
    return { ok: true, balance: newBal };
  },

  // ── Formatting ─────────────────────────────────
  formatPKR(amount) {
    return 'Rs ' + Number(amount).toLocaleString('en-PK', { minimumFractionDigits: 2 });
  },

  formatDate(iso) {
    const d = new Date(iso);
    const opts = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return d.toLocaleDateString('en-PK', opts);
  }
};
