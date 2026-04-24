import { useState } from 'react';
import CircularProgress from '../components/ui/CircularProgress';
import Modal from '../components/ui/Modal';
import { useFinanceStore } from '../store/useFinanceStore';
import { GOAL_ICONS } from '../utils/categories';
import { formatCurrency, formatDate, daysRemaining } from '../utils/formatters';
import { Trash2, Plus, PiggyBank, Pencil } from 'lucide-react';

const GOAL_COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#f97316', '#ef4444'];


export default function Goals() {
  const goals = useFinanceStore((s) => s.goals);
  const addGoal = useFinanceStore((s) => s.addGoal);
  const updateGoal = useFinanceStore((s) => s.updateGoal);
  const contributeToGoal = useFinanceStore((s) => s.contributeToGoal);
  const deleteGoal = useFinanceStore((s) => s.deleteGoal);

  const [modal, setModal] = useState(null); // 'add' | 'contribute' | 'edit'
  const [activeGoal, setActiveGoal] = useState(null);
  const [contribution, setContribution] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const defaultForm = { name: '', icon: 'savings', target: '', deadline: '', color: '#7c3aed' };
  const [form, setForm] = useState(defaultForm);

  const openContribute = (goal) => { setActiveGoal(goal); setContribution(''); setModal('contribute'); };
  const openEdit = (goal) => {
    setForm({ name: goal.name, icon: goal.icon, target: goal.target, deadline: goal.deadline, color: goal.color });
    setActiveGoal(goal);
    setModal('edit');
  };

  const handleAddGoal = (e) => {
    e.preventDefault();
    if (!form.name || !form.target || !form.deadline) return;
    addGoal({ name: form.name, icon: form.icon, target: Number(form.target), deadline: form.deadline, color: form.color });
    setForm(defaultForm);
    setModal(null);
  };

  const handleEditGoal = (e) => {
    e.preventDefault();
    updateGoal(activeGoal.id, { ...form, target: Number(form.target) });
    setModal(null);
  };

  const handleContribute = (e) => {
    e.preventDefault();
    if (!contribution || Number(contribution) <= 0) return;
    contributeToGoal(activeGoal.id, Number(contribution));
    setModal(null);
  };

  const GOAL_COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#f97316', '#ef4444'];

  const totalTargeted = goals.reduce((s, g) => s + g.target, 0);
  const totalSaved = goals.reduce((s, g) => s + g.saved, 0);
  const completed = goals.filter((g) => g.saved >= g.target).length;

  return (
    <div className="page-container animate-in">
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Savings Goals</h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {completed} of {goals.length} goals completed
          </p>
        </div>
        <button id="add-goal-btn" className="btn btn-primary" onClick={() => { setForm(defaultForm); setModal('add'); }}>
          <Plus size={15} /> New Goal
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Targeted', value: formatCurrency(totalTargeted, true), color: 'var(--purple)' },
          { label: 'Total Saved', value: formatCurrency(totalSaved, true), color: 'var(--green)' },
          { label: 'Remaining', value: formatCurrency(totalTargeted - totalSaved, true), color: 'var(--amber)' },
          { label: 'Completed', value: `${completed} / ${goals.length}`, color: 'var(--cyan)' },
        ].map((s) => (
          <div key={s.label} className="glass-card" style={{ padding: '16px 22px', flex: '1 1 160px' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <div className="empty-state-icon">🎯</div>
            <h3>No savings goals yet</h3>
            <p>Create your first goal to start tracking your progress</p>
          </div>
        </div>
      ) : (
        <div className="grid-auto">
          {goals.map((goal) => {
            const pct = Math.min(100, (goal.saved / goal.target) * 100);
            const days = daysRemaining(goal.deadline);
            const iconObj = GOAL_ICONS.find((i) => i.id === goal.icon) || GOAL_ICONS[0];
            const isCompleted = goal.saved >= goal.target;

            return (
              <div key={goal.id} className="glass-card" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
                {/* Glow */}
                <div style={{
                  position: 'absolute', top: -30, right: -30,
                  width: 120, height: 120,
                  background: `radial-gradient(circle, ${goal.color}18 0%, transparent 70%)`,
                  pointerEvents: 'none',
                }} />

                {/* Actions */}
                <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 6 }}>
                  <button className="btn-icon" style={{ padding: 6 }} onClick={() => openEdit(goal)} title="Edit">
                    <Pencil size={12} />
                  </button>
                  {confirmDelete === goal.id ? (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-danger btn-sm" onClick={() => { deleteGoal(goal.id); setConfirmDelete(null); }}>Delete</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setConfirmDelete(null)}>No</button>
                    </div>
                  ) : (
                    <button className="btn-icon" style={{ padding: 6, color: 'var(--red)' }} onClick={() => setConfirmDelete(goal.id)} title="Delete">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>

                {/* Main content */}
                <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 20 }}>
                  <CircularProgress percent={pct} size={88} strokeWidth={7} color={goal.color}>
                    <span style={{ fontSize: 22 }}>{iconObj.icon}</span>
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, color: goal.color, marginTop: 2 }}>
                      {pct.toFixed(0)}%
                    </span>
                  </CircularProgress>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 4 }}>{goal.name}</div>
                    {isCompleted ? (
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--green)', background: 'var(--green-dim)', padding: '2px 10px', borderRadius: 'var(--radius-full)' }}>
                        🎉 Completed!
                      </span>
                    ) : (
                      <span style={{
                        fontSize: '0.72rem', fontWeight: 600,
                        color: days < 0 ? 'var(--red)' : days < 30 ? 'var(--amber)' : 'var(--text-muted)',
                        background: days < 0 ? 'var(--red-dim)' : days < 30 ? 'var(--amber-dim)' : 'var(--bg-card)',
                        padding: '2px 10px', borderRadius: 'var(--radius-full)',
                        border: '1px solid var(--border)',
                      }}>
                        {days < 0 ? `Overdue by ${Math.abs(days)}d` : `${days} days left`}
                      </span>
                    )}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
                      Deadline: {formatDate(goal.deadline)}
                    </div>
                  </div>
                </div>

                {/* Amount row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Saved</div>
                    <div style={{ fontWeight: 800, color: goal.color, fontSize: '1rem' }}>{formatCurrency(goal.saved)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Target</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{formatCurrency(goal.target)}</div>
                  </div>
                </div>

                {!isCompleted && (
                  <button
                    id={`contribute-btn-${goal.id}`}
                    className="btn btn-primary w-full"
                    style={{ background: `linear-gradient(135deg, ${goal.color}, ${goal.color}99)`, boxShadow: `0 4px 14px ${goal.color}40` }}
                    onClick={() => openContribute(goal)}
                  >
                    <PiggyBank size={15} /> Add Money
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Goal Modal */}
      <Modal
        isOpen={modal === 'add' || modal === 'edit'}
        onClose={() => setModal(null)}
        title={modal === 'edit' ? 'Edit Goal' : 'New Savings Goal'}
      >
        <form onSubmit={modal === 'edit' ? handleEditGoal : handleAddGoal}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Goal Name</label>
            <input
              id="goal-name-input"
              type="text"
              placeholder="e.g. MacBook Pro"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          <div className="form-grid" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Target Amount (₹)</label>
              <input
                id="goal-target-input"
                type="number"
                min="1"
                placeholder="e.g. 150000"
                value={form.target}
                onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Deadline</label>
              <input
                id="goal-deadline-input"
                type="date"
                value={form.deadline}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Icon picker */}
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Icon</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {GOAL_ICONS.map((ic) => (
                <button
                  key={ic.id}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, icon: ic.id }))}
                  style={{
                    width: 40, height: 40, borderRadius: 10,
                    border: form.icon === ic.id ? '2px solid var(--accent-1)' : '1px solid var(--border)',
                    background: form.icon === ic.id ? 'var(--purple-dim)' : 'var(--bg-card)',
                    fontSize: 18, cursor: 'pointer',
                    transition: 'all var(--transition)',
                  }}
                  title={ic.label}
                >{ic.icon}</button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label">Color</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {GOAL_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: c,
                    border: form.color === c ? '3px solid white' : '2px solid transparent',
                    cursor: 'pointer',
                    boxShadow: form.color === c ? `0 0 8px ${c}` : 'none',
                    transition: 'all var(--transition)',
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setModal(null)}>Cancel</button>
            <button id="goal-submit-btn" type="submit" className="btn btn-primary" style={{ flex: 2 }}>
              {modal === 'edit' ? 'Save Changes' : 'Create Goal'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Contribute Modal */}
      <Modal isOpen={modal === 'contribute'} onClose={() => setModal(null)} title={`Add to: ${activeGoal?.name}`}>
        <form onSubmit={handleContribute}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Current: <b style={{ color: 'var(--text-primary)' }}>{formatCurrency(activeGoal?.saved)}</b>
              {' / '}
              <b>{formatCurrency(activeGoal?.target)}</b>
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label">Contribution Amount (₹)</label>
            <input
              id="contribute-amount-input"
              type="number"
              min="1"
              placeholder="e.g. 5000"
              value={contribution}
              onChange={(e) => setContribution(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setModal(null)}>Cancel</button>
            <button id="contribute-submit-btn" type="submit" className="btn btn-primary" style={{ flex: 2 }}>💰 Add Money</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

