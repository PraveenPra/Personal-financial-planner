import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SEED_TRANSACTIONS, SEED_BUDGETS, SEED_GOALS, SEED_USER_PROFILE } from '../data/seedData';
import { getMonthKey } from '../utils/formatters';
import { getFinancialHealthSummary } from '../utils/financialHealth';

// ─── Helpers ──────────────────────────────────────────────────────────────────
let _idCounter = Date.now();
const genId = () => String(++_idCounter);

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// ─── Store ────────────────────────────────────────────────────────────────────
export const useFinanceStore = create(
  persist(
    (set, get) => ({
      // ─── State ──────────────────────────────────────────────────────────────
      transactions: SEED_TRANSACTIONS,
      budgets: SEED_BUDGETS,
      goals: SEED_GOALS,
      settings: {
        name: 'Manikanta',
        currency: '₹',
        locale: 'en-IN',
      },
      userProfile: SEED_USER_PROFILE,

      // ─── Transaction Actions ─────────────────────────────────────────────
      addTransaction: (tx) =>
        set((s) => ({
          transactions: [{ ...tx, id: genId() }, ...s.transactions],
        })),

      addTransactionsBulk: (items) =>
        set((s) => ({
          transactions: [
            ...items.map((tx) => ({ ...tx, id: genId() })),
            ...s.transactions,
          ],
        })),

      updateTransaction: (id, updates) =>
        set((s) => ({
          transactions: s.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      deleteTransaction: (id) =>
        set((s) => ({
          transactions: s.transactions.filter((t) => t.id !== id),
        })),

      // ─── Budget Actions ──────────────────────────────────────────────────
      setBudget: (category, amount) =>
        set((s) => {
          const existing = s.budgets.find((b) => b.category === category);
          if (existing) {
            return {
              budgets: s.budgets.map((b) =>
                b.category === category ? { ...b, amount } : b
              ),
            };
          }
          return { budgets: [...s.budgets, { id: genId(), category, amount }] };
        }),

      deleteBudget: (category) =>
        set((s) => ({
          budgets: s.budgets.filter((b) => b.category !== category),
        })),

      // ─── Goal Actions ────────────────────────────────────────────────────
      addGoal: (goal) =>
        set((s) => ({
          goals: [...s.goals, { ...goal, id: genId(), saved: 0 }],
        })),

      updateGoal: (id, updates) =>
        set((s) => ({
          goals: s.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        })),

      contributeToGoal: (id, amount) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.id === id
              ? { ...g, saved: Math.min(g.target, g.saved + Number(amount)) }
              : g
          ),
        })),

      deleteGoal: (id) =>
        set((s) => ({
          goals: s.goals.filter((g) => g.id !== id),
        })),

      // ─── Settings Actions ────────────────────────────────────────────────
      updateSettings: (updates) =>
        set((s) => ({ settings: { ...s.settings, ...updates } })),

      updateUserProfile: (updates) =>
        set((s) => ({ userProfile: { ...SEED_USER_PROFILE, ...s.userProfile, ...updates } })),

      // ─── Reset ──────────────────────────────────────────────────────────
      resetAll: () =>
        set({
          transactions: SEED_TRANSACTIONS,
          budgets: SEED_BUDGETS,
          goals: SEED_GOALS,
          userProfile: SEED_USER_PROFILE,
        }),

      clearAll: () =>
        set({ transactions: [], budgets: [], goals: [], userProfile: SEED_USER_PROFILE }),

      // ─── Selectors ───────────────────────────────────────────────────────
      // All selectors are functions that read from state
      getTransactionsByMonth: (monthKey) => {
        const txs = get().transactions;
        return txs.filter((t) => getMonthKey(t.date) === monthKey);
      },

      getSummary: (monthKey) => {
        const mk = monthKey || currentMonth();
        const txs = get().transactions.filter((t) => getMonthKey(t.date) === mk);
        const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expenses = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        return { income, expenses, balance: income - expenses, savings: income > 0 ? ((income - expenses) / income) * 100 : 0 };
      },

      getTotalBalance: () => {
        const txs = get().transactions;
        return txs.reduce((s, t) => t.type === 'income' ? s + t.amount : s - t.amount, 0);
      },

      getCategoryTotals: (monthKey, type = 'expense') => {
        const mk = monthKey || currentMonth();
        const txs = get().transactions.filter(
          (t) => t.type === type && getMonthKey(t.date) === mk
        );
        const totals = {};
        txs.forEach((t) => {
          totals[t.category] = (totals[t.category] || 0) + t.amount;
        });
        return totals;
      },

      getBudgetProgress: (monthKey) => {
        const mk = monthKey || currentMonth();
        const budgets = get().budgets;
        const spending = get().getCategoryTotals(mk, 'expense');
        return budgets.map((b) => ({
          ...b,
          spent: spending[b.category] || 0,
          percent: Math.min(100, ((spending[b.category] || 0) / b.amount) * 100),
        }));
      },

      getMonthlyData: () => {
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setDate(1);
          d.setMonth(d.getMonth() - i);
          const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          months.push(mk);
        }
        const txs = get().transactions;
        return months.map((mk) => {
          const filtered = txs.filter((t) => getMonthKey(t.date) === mk);
          const income = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
          const expenses = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
          const [year, month] = mk.split('-');
          const label = new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
          return { month: mk, label, income, expenses, savings: income - expenses };
        });
      },

      getFinancialHealth: () => getFinancialHealthSummary(get()),
    }),
    {
      name: 'finflow-storage',
      version: 2,
      migrate: (persistedState) => ({
        ...persistedState,
        userProfile: { ...SEED_USER_PROFILE, ...(persistedState?.userProfile || {}) },
      }),
    }
  )
);
