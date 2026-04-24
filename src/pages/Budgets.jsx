import { useState } from 'react';
import ProgressBar from '../components/ui/ProgressBar';
import Modal from '../components/ui/Modal';
import { useFinanceStore } from '../store/useFinanceStore';
import { getCategoryById, EXPENSE_CATEGORIES } from '../utils/categories';
import { formatCurrency } from '../utils/formatters';
import { Trash2, Plus, Wallet } from 'lucide-react';
import ReactApexChart from 'react-apexcharts';

export default function Budgets() {
  const getBudgetProgress = useFinanceStore((s) => s.getBudgetProgress);
  const setBudget = useFinanceStore((s) => s.setBudget);
  const deleteBudget = useFinanceStore((s) => s.deleteBudget);
  const budgets = useFinanceStore((s) => s.budgets);

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ category: 'food', amount: '' });
  const [confirmDelete, setConfirmDelete] = useState(null);

  const currentMK = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();

  const progress = getBudgetProgress(currentMK);
  const totalBudgeted = progress.reduce((s, b) => s + b.amount, 0);
  const totalSpent = progress.reduce((s, b) => s + b.spent, 0);
  const overBudget = progress.filter((b) => b.percent >= 100);

  // Chart: budget vs actual bar
  const chartOptions = {
    chart: { type: 'bar', background: 'transparent', toolbar: { show: false },
      animations: { enabled: true, easing: 'easeinout', speed: 600 } },
    colors: ['#7c3aed', '#f43f5e'],
    plotOptions: { bar: { borderRadius: 6, columnWidth: '55%', grouped: true } },
    xaxis: {
      categories: progress.map((b) => getCategoryById(b.category).label),
      labels: { style: { colors: '#8892aa', fontSize: '11px' }, rotate: -30 },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: '#8892aa', fontSize: '11px' }, formatter: (v) => formatCurrency(v, true) },
    },
    grid: { borderColor: 'rgba(255,255,255,0.06)', strokeDashArray: 4 },
    tooltip: { theme: 'dark', y: { formatter: (v) => formatCurrency(v) } },
    legend: { labels: { colors: '#8892aa' } },
    dataLabels: { enabled: false },
  };

  const chartSeries = [
    { name: 'Budget', data: progress.map((b) => b.amount) },
    { name: 'Spent', data: progress.map((b) => b.spent) },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) return;
    setBudget(form.category, Number(form.amount));
    setModal(false);
    setForm({ category: 'food', amount: '' });
  };

  const usedCategories = new Set(budgets.map((b) => b.category));

  return (
    <div className="page-container animate-in">
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Budgets</h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {overBudget.length > 0
              ? `⚠️ ${overBudget.length} category exceeded budget`
              : '✅ All budgets on track this month'}
          </p>
        </div>
        <button id="add-budget-btn" className="btn btn-primary" onClick={() => setModal(true)}>
          <Plus size={15} /> Set Budget
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Budgeted', value: formatCurrency(totalBudgeted), color: 'var(--purple)' },
          { label: 'Total Spent', value: formatCurrency(totalSpent), color: 'var(--red)' },
          { label: 'Remaining', value: formatCurrency(totalBudgeted - totalSpent), color: totalBudgeted - totalSpent >= 0 ? 'var(--green)' : 'var(--red)' },
          { label: 'Over Budget', value: `${overBudget.length} categories`, color: overBudget.length > 0 ? 'var(--red)' : 'var(--green)' },
        ].map((s) => (
          <div key={s.label} className="glass-card" style={{ padding: '16px 22px', flex: '1 1 180px' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      {progress.length > 0 && (
        <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16 }}>Budget vs Actual</h2>
          <ReactApexChart options={chartOptions} series={chartSeries} type="bar" height={260} />
        </div>
      )}

      {/* Budget cards grid */}
      <div className="grid-auto">
        {progress.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-state-icon">💸</div>
            <h3>No budgets set</h3>
            <p>Click "Set Budget" to start tracking your spending limits</p>
          </div>
        ) : (
          progress.map((b) => {
            const cat = getCategoryById(b.category);
            const statusColor = b.percent >= 100 ? 'var(--red)' : b.percent >= 75 ? 'var(--amber)' : 'var(--green)';
            return (
              <div key={b.category} className="glass-card" style={{ padding: 20 }}>
                <div className="flex-between" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: `${cat.color}18`, border: `1px solid ${cat.color}28`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18,
                    }}>{cat.icon}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{cat.label}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        Budget: {formatCurrency(b.amount)}
                      </div>
                    </div>
                  </div>
                  {confirmDelete === b.category ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-danger btn-sm" onClick={() => { deleteBudget(b.category); setConfirmDelete(null); }}>Delete</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setConfirmDelete(null)}>No</button>
                    </div>
                  ) : (
                    <button className="btn-icon" style={{ padding: 6, color: 'var(--red)' }} onClick={() => setConfirmDelete(b.category)}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="flex-between" style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Spent: <b style={{ color: statusColor }}>{formatCurrency(b.spent)}</b>
                  </span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: statusColor }}>
                    {b.percent.toFixed(0)}%
                  </span>
                </div>
                <ProgressBar percent={b.percent} height={8} />
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 8 }}>
                  {b.percent >= 100
                    ? `Over by ${formatCurrency(b.spent - b.amount)}`
                    : `${formatCurrency(b.amount - b.spent)} remaining`}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Set Budget Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Set Monthly Budget">
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Category</label>
            <select
              id="budget-cat-select"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.label} {usedCategories.has(c.id) ? '(editing)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label">Monthly Budget Amount (₹)</label>
            <input
              id="budget-amount-input"
              type="number"
              min="1"
              placeholder="e.g. 8000"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setModal(false)}>Cancel</button>
            <button id="budget-submit-btn" type="submit" className="btn btn-primary" style={{ flex: 2 }}>Save Budget</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
