// Simple counter-based ID generator (no external deps needed)
let idCounter = Date.now();
export const genId = () => `${idCounter++}`;

const today = new Date();
const mo = (offset = 0) => {
  const d = new Date(today);
  d.setMonth(d.getMonth() + offset);
  return d;
};
const dt = (d, day) => {
  const date = new Date(d);
  date.setDate(day);
  return date.toISOString().split('T')[0];
};

export const SEED_TRANSACTIONS = [
  // April 2025 (current month)
  { id: genId(), type: 'income',  category: 'salary',        amount: 85000, note: 'Monthly salary – April', date: dt(mo(0), 1) },
  { id: genId(), type: 'income',  category: 'freelance',     amount: 18500, note: 'UI project payment', date: dt(mo(0), 8) },
  { id: genId(), type: 'expense', category: 'rent',          amount: 18000, note: 'Monthly rent', date: dt(mo(0), 2) },
  { id: genId(), type: 'expense', category: 'food',          amount: 4200,  note: 'Groceries & dining', date: dt(mo(0), 5) },
  { id: genId(), type: 'expense', category: 'utilities',     amount: 2100,  note: 'Electricity + internet', date: dt(mo(0), 6) },
  { id: genId(), type: 'expense', category: 'transport',     amount: 3500,  note: 'Ola, fuel, metro', date: dt(mo(0), 10) },
  { id: genId(), type: 'expense', category: 'entertainment', amount: 1800,  note: 'Netflix, Spotify, movies', date: dt(mo(0), 12) },
  { id: genId(), type: 'expense', category: 'health',        amount: 2800,  note: 'Gym + medicines', date: dt(mo(0), 14) },
  { id: genId(), type: 'expense', category: 'shopping',      amount: 5400,  note: 'Clothes & accessories', date: dt(mo(0), 18) },
  { id: genId(), type: 'expense', category: 'education',     amount: 3000,  note: 'Online courses', date: dt(mo(0), 20) },

  // March 2025
  { id: genId(), type: 'income',  category: 'salary',        amount: 85000, note: 'Monthly salary – March', date: dt(mo(-1), 1) },
  { id: genId(), type: 'income',  category: 'dividends',     amount: 4200,  note: 'Zerodha dividends', date: dt(mo(-1), 15) },
  { id: genId(), type: 'expense', category: 'rent',          amount: 18000, note: 'Monthly rent', date: dt(mo(-1), 2) },
  { id: genId(), type: 'expense', category: 'food',          amount: 5100,  note: 'Zomato + groceries', date: dt(mo(-1), 7) },
  { id: genId(), type: 'expense', category: 'transport',     amount: 2800,  note: 'Fuel + cab', date: dt(mo(-1), 9) },
  { id: genId(), type: 'expense', category: 'travel',        amount: 12000, note: 'Goa trip', date: dt(mo(-1), 20) },
  { id: genId(), type: 'expense', category: 'utilities',     amount: 1900,  note: 'Bills', date: dt(mo(-1), 5) },
  { id: genId(), type: 'expense', category: 'health',        amount: 1500,  note: 'Doctor visit', date: dt(mo(-1), 14) },

  // February 2025
  { id: genId(), type: 'income',  category: 'salary',        amount: 85000, note: 'Monthly salary – Feb', date: dt(mo(-2), 1) },
  { id: genId(), type: 'income',  category: 'freelance',     amount: 22000, note: 'Logo design + dev', date: dt(mo(-2), 12) },
  { id: genId(), type: 'expense', category: 'rent',          amount: 18000, note: 'Monthly rent', date: dt(mo(-2), 2) },
  { id: genId(), type: 'expense', category: 'food',          amount: 3800,  note: 'Groceries', date: dt(mo(-2), 8) },
  { id: genId(), type: 'expense', category: 'shopping',      amount: 8200,  note: 'Valentine gifts + shopping', date: dt(mo(-2), 14) },
  { id: genId(), type: 'expense', category: 'investment',    amount: 10000, note: 'SIP – mutual fund', date: dt(mo(-2), 5) },
  { id: genId(), type: 'expense', category: 'transport',     amount: 2200,  note: 'Fuel', date: dt(mo(-2), 10) },

  // January 2025
  { id: genId(), type: 'income',  category: 'salary',        amount: 85000, note: 'Monthly salary – Jan', date: dt(mo(-3), 1) },
  { id: genId(), type: 'income',  category: 'gift',          amount: 5000,  note: 'New Year bonus', date: dt(mo(-3), 3) },
  { id: genId(), type: 'expense', category: 'rent',          amount: 18000, note: 'Monthly rent', date: dt(mo(-3), 2) },
  { id: genId(), type: 'expense', category: 'food',          amount: 4500,  note: 'Party + groceries', date: dt(mo(-3), 5) },
  { id: genId(), type: 'expense', category: 'entertainment', amount: 3200,  note: 'New Year celebrations', date: dt(mo(-3), 1) },
  { id: genId(), type: 'expense', category: 'investment',    amount: 10000, note: 'SIP', date: dt(mo(-3), 5) },
  { id: genId(), type: 'expense', category: 'insurance',     amount: 12000, note: 'Annual health insurance', date: dt(mo(-3), 10) },

  // December 2024
  { id: genId(), type: 'income',  category: 'salary',        amount: 85000, note: 'Monthly salary – Dec', date: dt(mo(-4), 1) },
  { id: genId(), type: 'income',  category: 'business',      amount: 15000, note: 'Side project revenue', date: dt(mo(-4), 20) },
  { id: genId(), type: 'expense', category: 'rent',          amount: 18000, note: 'Monthly rent', date: dt(mo(-4), 2) },
  { id: genId(), type: 'expense', category: 'shopping',      amount: 9500,  note: 'Christmas shopping', date: dt(mo(-4), 22) },
  { id: genId(), type: 'expense', category: 'travel',        amount: 18000, note: 'Family trip to Ooty', date: dt(mo(-4), 26) },
  { id: genId(), type: 'expense', category: 'food',          amount: 4800,  note: 'Dining out', date: dt(mo(-4), 15) },

  // November 2024
  { id: genId(), type: 'income',  category: 'salary',        amount: 85000, note: 'Monthly salary – Nov', date: dt(mo(-5), 1) },
  { id: genId(), type: 'expense', category: 'rent',          amount: 18000, note: 'Monthly rent', date: dt(mo(-5), 2) },
  { id: genId(), type: 'expense', category: 'food',          amount: 3900,  note: 'Groceries & dining', date: dt(mo(-5), 10) },
  { id: genId(), type: 'expense', category: 'investment',    amount: 10000, note: 'SIP', date: dt(mo(-5), 5) },
  { id: genId(), type: 'expense', category: 'utilities',     amount: 2000,  note: 'Bills', date: dt(mo(-5), 6) },
  { id: genId(), type: 'expense', category: 'education',     amount: 5000,  note: 'AWS certification course', date: dt(mo(-5), 15) },
];

export const SEED_BUDGETS = [
  { id: genId(), category: 'food',          amount: 6000 },
  { id: genId(), category: 'transport',     amount: 4000 },
  { id: genId(), category: 'rent',          amount: 20000 },
  { id: genId(), category: 'utilities',     amount: 3000 },
  { id: genId(), category: 'shopping',      amount: 8000 },
  { id: genId(), category: 'health',        amount: 3000 },
  { id: genId(), category: 'entertainment', amount: 2500 },
  { id: genId(), category: 'investment',    amount: 10000 },
  { id: genId(), category: 'education',     amount: 4000 },
];

export const SEED_GOALS = [
  {
    id: genId(),
    name: 'MacBook Pro',
    icon: 'laptop',
    target: 180000,
    saved: 72000,
    deadline: dt(mo(6), 1),
    color: '#3b82f6',
  },
  {
    id: genId(),
    name: 'Europe Vacation',
    icon: 'vacation',
    target: 250000,
    saved: 95000,
    deadline: dt(mo(10), 1),
    color: '#10b981',
  },
  {
    id: genId(),
    name: 'Emergency Fund',
    icon: 'savings',
    target: 300000,
    saved: 185000,
    deadline: dt(mo(4), 1),
    color: '#f59e0b',
  },
  {
    id: genId(),
    name: 'New Car Down Payment',
    icon: 'car',
    target: 500000,
    saved: 120000,
    deadline: dt(mo(18), 1),
    color: '#8b5cf6',
  },
];
