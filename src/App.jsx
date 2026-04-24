import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import TransactionModal from './components/modals/TransactionModal';
import StatementImportModal from './components/modals/StatementImportModal';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Goals from './pages/Goals';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import { useUIStore } from './store/useUIStore';

export default function App() {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <TopBar />
        <Routes>
          <Route path="/"             element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/budgets"      element={<Budgets />} />
          <Route path="/goals"        element={<Goals />} />
          <Route path="/analytics"    element={<Analytics />} />
          <Route path="/settings"     element={<Settings />} />
        </Routes>
      </div>

      {/* Global modals */}
      <TransactionModal />
      <StatementImportModal />
    </div>
  );
}
