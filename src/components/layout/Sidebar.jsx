import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, Wallet, Target,
  BarChart3, Settings, TrendingUp, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/formatters';

const NAV_ITEMS = [
  { to: '/',            icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight,  label: 'Transactions' },
  { to: '/budgets',      icon: Wallet,           label: 'Budgets' },
  { to: '/goals',        icon: Target,           label: 'Goals' },
  { to: '/analytics',   icon: BarChart3,         label: 'Analytics' },
  { to: '/settings',    icon: Settings,          label: 'Settings' },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const getTotalBalance = useFinanceStore((s) => s.getTotalBalance);
  const settings = useFinanceStore((s) => s.settings);

  return (
    <aside
      className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
      style={{
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        width: sidebarCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-w)',
        background: 'rgba(14, 21, 37, 0.95)',
        borderRight: '1px solid var(--border)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        transition: 'width var(--transition-slow)',
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div style={{
        padding: sidebarCollapsed ? '20px 0' : '24px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: sidebarCollapsed ? 'center' : 'space-between',
        borderBottom: '1px solid var(--border)',
        minHeight: 'var(--topbar-h)',
      }}>
        {!sidebarCollapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36,
              borderRadius: 10,
              background: 'var(--gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
              boxShadow: '0 4px 14px rgba(124,58,237,0.4)',
              flexShrink: 0,
            }}>💹</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em' }}>
                <span className="gradient-text">FinFlow</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 1 }}>Finance Planner</div>
            </div>
          </div>
        )}
        {sidebarCollapsed && (
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--gradient)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 18,
            boxShadow: '0 4px 14px rgba(124,58,237,0.4)',
          }}>💹</div>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: sidebarCollapsed ? '12px 0' : '11px 16px',
              margin: '2px 8px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: 500,
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              color: isActive ? 'white' : 'var(--text-secondary)',
              background: isActive ? 'var(--gradient)' : 'transparent',
              boxShadow: isActive ? '0 4px 14px rgba(124,58,237,0.3)' : 'none',
              transition: 'all var(--transition)',
              textDecoration: 'none',
            })}
            title={sidebarCollapsed ? label : undefined}
          >
            {({ isActive }) => (
              <>
                <Icon size={18} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.7 }} />
                {!sidebarCollapsed && <span>{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Balance card */}
      {!sidebarCollapsed && (
        <div style={{
          margin: '0 12px 12px',
          padding: '14px 16px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
        }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Net Balance</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: 4, color: getTotalBalance() >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {formatCurrency(getTotalBalance(), true)}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Hi, {settings.name} 👋
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="btn-icon"
        style={{
          margin: '0 auto 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 32, height: 32, borderRadius: '50%',
        }}
        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
}
