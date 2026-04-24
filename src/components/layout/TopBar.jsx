import { useLocation } from 'react-router-dom';
import { Plus, Bell } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';

const PAGE_LABELS = {
  '/':             'Dashboard',
  '/transactions': 'Transactions',
  '/budgets':      'Budgets',
  '/goals':        'Savings Goals',
  '/analytics':    'Analytics',
  '/settings':     'Settings',
};

export default function TopBar() {
  const { pathname } = useLocation();
  const { sidebarCollapsed, openModal } = useUIStore();

  const now = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: sidebarCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-w)',
      right: 0,
      height: 'var(--topbar-h)',
      background: 'rgba(8, 12, 20, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      zIndex: 99,
      transition: 'left var(--transition-slow)',
    }}>
      <div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          {PAGE_LABELS[pathname] || 'FinFlow'}
        </h1>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 1 }}>{now}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          id="add-transaction-btn"
          className="btn btn-primary btn-sm"
          onClick={() => openModal('addTransaction')}
          style={{ gap: 6 }}
        >
          <Plus size={15} />
          Add Transaction
        </button>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'var(--gradient)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.875rem', fontWeight: 700,
          boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
          flexShrink: 0,
        }}>M</div>
      </div>
    </header>
  );
}
