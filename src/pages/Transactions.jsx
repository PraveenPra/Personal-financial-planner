import { useState } from 'react';
import { Pencil, Trash2, Search, Filter } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { useUIStore } from '../store/useUIStore';
import { getCategoryById, CATEGORIES } from '../utils/categories';
import { formatCurrency, formatDate, getMonthKey } from '../utils/formatters';

export default function Transactions() {
  const transactions = useFinanceStore((s) => s.transactions);
  const deleteTransaction = useFinanceStore((s) => s.deleteTransaction);
  const { openModal, txFilter, setTxFilter, resetTxFilter } = useUIStore();
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Apply filters
  const filtered = transactions
    .filter((t) => {
      const cat = getCategoryById(t.category);
      const search = txFilter.search.toLowerCase();
      if (search && !(t.note?.toLowerCase().includes(search) || cat.label.toLowerCase().includes(search))) return false;
      if (txFilter.type !== 'all' && t.type !== txFilter.type) return false;
      if (txFilter.category !== 'all' && t.category !== txFilter.category) return false;
      if (txFilter.dateFrom && t.date < txFilter.dateFrom) return false;
      if (txFilter.dateTo && t.date > txFilter.dateTo) return false;
      return true;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalIncome = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const handleDelete = (id) => {
    deleteTransaction(id);
    setConfirmDelete(null);
  };

  return (
    <div className="page-container animate-in">
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Transactions</h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {filtered.length} transaction{filtered.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <button
          id="add-tx-page-btn"
          className="btn btn-primary"
          onClick={() => openModal('addTransaction')}
        >
          + Add Transaction
        </button>
      </div>

      {/* Summary bar */}
      <div className="glass-card" style={{ padding: '16px 24px', marginBottom: 20, display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Income</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--green)', marginTop: 2 }}>{formatCurrency(totalIncome)}</div>
        </div>
        <div style={{ width: 1, background: 'var(--border)' }} />
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Expenses</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--red)', marginTop: 2 }}>{formatCurrency(totalExpense)}</div>
        </div>
        <div style={{ width: 1, background: 'var(--border)' }} />
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Net</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: totalIncome - totalExpense >= 0 ? 'var(--green)' : 'var(--red)', marginTop: 2 }}>
            {formatCurrency(totalIncome - totalExpense)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
          {/* Search */}
          <div className="form-group">
            <label className="form-label">Search</label>
            <div className="search-wrap">
              <Search size={14} className="search-icon" />
              <input
                id="tx-search"
                type="text"
                placeholder="Search transactions..."
                value={txFilter.search}
                onChange={(e) => setTxFilter({ search: e.target.value })}
              />
            </div>
          </div>
          {/* Type */}
          <div className="form-group">
            <label className="form-label">Type</label>
            <select id="tx-type-filter" value={txFilter.type} onChange={(e) => setTxFilter({ type: e.target.value })}>
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          {/* Category */}
          <div className="form-group">
            <label className="form-label">Category</label>
            <select id="tx-cat-filter" value={txFilter.category} onChange={(e) => setTxFilter({ category: e.target.value })}>
              <option value="all">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>
          {/* Date From */}
          <div className="form-group">
            <label className="form-label">Date From</label>
            <input
              id="tx-date-from"
              type="date"
              value={txFilter.dateFrom}
              onChange={(e) => setTxFilter({ dateFrom: e.target.value })}
            />
          </div>
          {/* Reset */}
          <button className="btn btn-secondary btn-sm" onClick={resetTxFilter} style={{ height: 42 }}>Reset</button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>No transactions found</h3>
            <p>Try adjusting filters or add a new transaction</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Note</th>
                <th>Date</th>
                <th>Type</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => {
                const cat = getCategoryById(tx.category);
                return (
                  <tr key={tx.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: 9,
                          background: `${cat.color}18`, border: `1px solid ${cat.color}28`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 15, flexShrink: 0,
                        }}>{cat.icon}</div>
                        <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>{cat.label}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', maxWidth: 200 }}>
                      <div className="truncate">{tx.note || '—'}</div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                      {formatDate(tx.date)}
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        background: tx.type === 'income' ? 'var(--green-dim)' : 'var(--red-dim)',
                        color: tx.type === 'income' ? 'var(--green)' : 'var(--red)',
                        border: `1px solid ${tx.type === 'income' ? 'rgba(16,185,129,0.25)' : 'rgba(244,63,94,0.25)'}`,
                      }}>
                        {tx.type === 'income' ? '↑ Income' : '↓ Expense'}
                      </span>
                    </td>
                    <td style={{
                      textAlign: 'right',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      color: tx.type === 'income' ? 'var(--green)' : 'var(--red)',
                      whiteSpace: 'nowrap',
                    }}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          className="btn-icon"
                          onClick={() => openModal('editTransaction', tx)}
                          title="Edit"
                          style={{ padding: 6 }}
                        ><Pencil size={13} /></button>
                        {confirmDelete === tx.id ? (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(tx.id)}
                          >Confirm</button>
                        ) : (
                          <button
                            className="btn-icon"
                            onClick={() => setConfirmDelete(tx.id)}
                            title="Delete"
                            style={{ padding: 6, color: 'var(--red)' }}
                          ><Trash2 size={13} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
