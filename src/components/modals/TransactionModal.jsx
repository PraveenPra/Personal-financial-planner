import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useUIStore } from '../../store/useUIStore';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../utils/categories';
import { todayISO } from '../../utils/formatters';

const defaultForm = {
  type: 'expense',
  amount: '',
  category: 'food',
  note: '',
  date: todayISO(),
};

export default function TransactionModal() {
  const { modal, modalData, closeModal } = useUIStore();
  const { addTransaction, updateTransaction } = useFinanceStore();
  const isEdit = modal === 'editTransaction';
  const isOpen = modal === 'addTransaction' || isEdit;

  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (isEdit && modalData) {
        setForm({ ...modalData });
      } else {
        setForm(defaultForm);
      }
      setError('');
    }
  }, [isOpen, isEdit, modalData]);

  const cats = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleChange = (field, value) => {
    setForm((f) => {
      const next = { ...f, [field]: value };
      // Reset category when type changes
      if (field === 'type') {
        next.category = value === 'income' ? 'salary' : 'food';
      }
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }
    const tx = { ...form, amount: Number(form.amount) };
    if (isEdit) {
      updateTransaction(modalData.id, tx);
    } else {
      addTransaction(tx);
    }
    closeModal();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title={isEdit ? 'Edit Transaction' : 'Add Transaction'}
    >
      <form onSubmit={handleSubmit}>
        {/* Type toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['expense', 'income'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleChange('type', t)}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600, fontSize: '0.875rem',
                border: form.type === t
                  ? `2px solid ${t === 'income' ? 'var(--green)' : 'var(--red)'}`
                  : '2px solid var(--border)',
                background: form.type === t
                  ? t === 'income' ? 'var(--green-dim)' : 'var(--red-dim)'
                  : 'var(--bg-card)',
                color: form.type === t
                  ? t === 'income' ? 'var(--green)' : 'var(--red)'
                  : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all var(--transition)',
              }}
            >
              {t === 'income' ? '💰 Income' : '💸 Expense'}
            </button>
          ))}
        </div>

        <div className="form-grid" style={{ marginBottom: 16 }}>
          {/* Amount */}
          <div className="form-group">
            <label className="form-label">Amount (₹)</label>
            <input
              id="tx-amount"
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 2500"
              value={form.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              required
            />
          </div>

          {/* Date */}
          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              id="tx-date"
              type="date"
              value={form.date}
              max={todayISO()}
              onChange={(e) => handleChange('date', e.target.value)}
              required
            />
          </div>
        </div>

        {/* Category */}
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">Category</label>
          <select
            id="tx-category"
            value={form.category}
            onChange={(e) => handleChange('category', e.target.value)}
          >
            {cats.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
            ))}
          </select>
        </div>

        {/* Note */}
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label className="form-label">Note (optional)</label>
          <input
            id="tx-note"
            type="text"
            placeholder="e.g. Grocery shopping at DMart"
            value={form.note}
            onChange={(e) => handleChange('note', e.target.value)}
            maxLength={100}
          />
        </div>

        {error && (
          <div style={{ color: 'var(--red)', fontSize: '0.8rem', marginBottom: 12, background: 'var(--red-dim)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={closeModal}>
            Cancel
          </button>
          <button id="tx-submit-btn" type="submit" className="btn btn-primary" style={{ flex: 2 }}>
            {isEdit ? '✓ Update Transaction' : '+ Add Transaction'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
