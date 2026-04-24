import { useState } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { formatCurrency, getMonthKey } from '../utils/formatters';
import { getCategoryById } from '../utils/categories';
import { Download, Trash2, RotateCcw, User, Database } from 'lucide-react';

export default function Settings() {
  const settings = useFinanceStore((s) => s.settings);
  const updateSettings = useFinanceStore((s) => s.updateSettings);
  const transactions = useFinanceStore((s) => s.transactions);
  const resetAll = useFinanceStore((s) => s.resetAll);
  const clearAll = useFinanceStore((s) => s.clearAll);

  const [form, setForm] = useState({ name: settings.name });
  const [saved, setSaved] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateSettings({ name: form.name });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Amount (₹)', 'Note'];
    const rows = [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map((t) => {
        const cat = getCategoryById(t.category);
        return [t.date, t.type, cat.label, t.amount, `"${(t.note || '').replace(/"/g, '""')}"`];
      });
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finflow_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Stats
  const totalTx = transactions.length;
  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const currentMK = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();
  const thisMonthTx = transactions.filter((t) => getMonthKey(t.date) === currentMK).length;

  return (
    <div className="page-container animate-in" style={{ maxWidth: 720 }}>
      <h1 className="page-title" style={{ marginBottom: 8 }}>Settings</h1>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 28 }}>Manage your profile and data</p>

      {/* Profile */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--purple-dim)', border: '1px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={18} color="var(--text-accent)" />
          </div>
          <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>Profile</h2>
        </div>
        <form onSubmit={handleSaveProfile}>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Display Name</label>
            <input
              id="profile-name-input"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ name: e.target.value })}
              placeholder="Your name"
              maxLength={40}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Currency</label>
            <input type="text" value="₹ Indian Rupee (INR)" disabled
              style={{ opacity: 0.5, cursor: 'not-allowed' }} />
          </div>
          <button id="save-profile-btn" type="submit" className="btn btn-primary btn-sm">
            {saved ? '✓ Saved!' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* Data overview */}
      <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--blue-dim)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Database size={18} color="var(--blue)" />
          </div>
          <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>Data Overview</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Transactions', value: totalTx },
            { label: 'This Month', value: thisMonthTx },
            { label: 'Total Income', value: formatCurrency(totalIncome, true) },
            { label: 'Total Expenses', value: formatCurrency(totalExpense, true) },
          ].map((s) => (
            <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>{s.value}</div>
            </div>
          ))}
        </div>
        <button id="export-csv-btn" className="btn btn-secondary" onClick={handleExportCSV}>
          <Download size={15} /> Export to CSV
        </button>
      </div>

      {/* Danger Zone */}
      <div className="glass-card" style={{ padding: 28, borderColor: 'rgba(244,63,94,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--red-dim)', border: '1px solid rgba(244,63,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Trash2 size={18} color="var(--red)" />
          </div>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>Danger Zone</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>These actions cannot be undone</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Reset to demo data */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Reset to Demo Data</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>Restore all sample transactions, budgets, and goals</div>
            </div>
            {confirmReset ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button id="confirm-reset-btn" className="btn btn-secondary btn-sm" onClick={() => { resetAll(); setConfirmReset(false); }}>Yes, Reset</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setConfirmReset(false)}>Cancel</button>
              </div>
            ) : (
              <button id="reset-btn" className="btn btn-secondary btn-sm" onClick={() => setConfirmReset(true)}>
                <RotateCcw size={13} /> Reset Data
              </button>
            )}
          </div>

          {/* Clear all */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--red-dim)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(244,63,94,0.25)', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--red)' }}>Clear All Data</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>Permanently delete all transactions, budgets and goals</div>
            </div>
            {confirmClear ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button id="confirm-clear-btn" className="btn btn-danger btn-sm" onClick={() => { clearAll(); setConfirmClear(false); }}>Yes, Delete All</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setConfirmClear(false)}>Cancel</button>
              </div>
            ) : (
              <button id="clear-all-btn" className="btn btn-danger btn-sm" onClick={() => setConfirmClear(true)}>
                <Trash2 size={13} /> Clear All
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
