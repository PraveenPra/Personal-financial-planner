import ReactApexChart from 'react-apexcharts';
import StatCard from '../components/ui/StatCard';
import ProgressBar from '../components/ui/ProgressBar';
import { useFinanceStore } from '../store/useFinanceStore';
import { formatCurrency, formatDate, getMonthKey } from '../utils/formatters';
import { getCategoryById } from '../utils/categories';
import { useUIStore } from '../store/useUIStore';
import { TrendingUp, TrendingDown, Wallet, Target, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const CHART_COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#f97316', '#a78bfa'];

export default function Dashboard() {
  const getSummary = useFinanceStore((s) => s.getSummary);
  const getTotalBalance = useFinanceStore((s) => s.getTotalBalance);
  const getMonthlyData = useFinanceStore((s) => s.getMonthlyData);
  const getBudgetProgress = useFinanceStore((s) => s.getBudgetProgress);
  const getCategoryTotals = useFinanceStore((s) => s.getCategoryTotals);
  const transactions = useFinanceStore((s) => s.transactions);
  const goals = useFinanceStore((s) => s.goals);
  const { openModal } = useUIStore();

  const currentMK = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();
  const prevMK = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();

  const summary = getSummary(currentMK);
  const prevSummary = getSummary(prevMK);
  const totalBalance = getTotalBalance();
  const monthlyData = getMonthlyData();
  const budgetProgress = getBudgetProgress(currentMK).slice(0, 5);
  const categoryTotals = getCategoryTotals(currentMK, 'expense');
  const recentTx = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

  // Trend calc
  const incomeTrend = prevSummary.income > 0
    ? (((summary.income - prevSummary.income) / prevSummary.income) * 100).toFixed(1)
    : 0;
  const expTrend = prevSummary.expenses > 0
    ? (((summary.expenses - prevSummary.expenses) / prevSummary.expenses) * 100).toFixed(1)
    : 0;

  // ApexCharts: Area chart (monthly income vs expenses)
  const areaOptions = {
    chart: {
      type: 'area',
      background: 'transparent',
      toolbar: { show: false },
      animations: { enabled: true, easing: 'easeinout', speed: 600 },
    },
    colors: ['#10b981', '#f43f5e'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.35,
        opacityTo: 0.02,
        stops: [0, 100],
      },
    },
    stroke: { curve: 'smooth', width: 2.5 },
    grid: { borderColor: 'rgba(255,255,255,0.06)', strokeDashArray: 4 },
    xaxis: {
      categories: monthlyData.map((m) => m.label),
      labels: { style: { colors: '#8892aa', fontSize: '11px' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: '#8892aa', fontSize: '11px' },
        formatter: (v) => formatCurrency(v, true),
      },
    },
    tooltip: {
      theme: 'dark',
      y: { formatter: (v) => formatCurrency(v) },
    },
    legend: { labels: { colors: '#8892aa' } },
    dataLabels: { enabled: false },
  };

  const areaSeries = [
    { name: 'Income', data: monthlyData.map((m) => m.income) },
    { name: 'Expenses', data: monthlyData.map((m) => m.expenses) },
  ];

  // ApexCharts: Donut chart (expense categories)
  const catLabels = Object.keys(categoryTotals).map((k) => getCategoryById(k).label);
  const catValues = Object.values(categoryTotals);

  const donutOptions = {
    chart: { type: 'donut', background: 'transparent' },
    colors: CHART_COLORS,
    labels: catLabels,
    legend: {
      position: 'bottom',
      labels: { colors: '#8892aa' },
      fontSize: '12px',
    },
    plotOptions: {
      pie: {
        donut: {
          size: '68%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Spent',
              color: '#8892aa',
              fontSize: '12px',
              formatter: () => formatCurrency(catValues.reduce((a, b) => a + b, 0), true),
            },
          },
        },
      },
    },
    tooltip: {
      theme: 'dark',
      y: { formatter: (v) => formatCurrency(v) },
    },
    dataLabels: { enabled: false },
    stroke: { colors: ['#0e1525'], width: 3 },
  };

  return (
    <div className="page-container animate-in">
      {/* Stat Cards */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        <StatCard
          icon="💳"
          label="Net Balance"
          value={formatCurrency(totalBalance, true)}
          accent="#7c3aed"
          sublabel="All time"
          trend={totalBalance >= 0 ? 'up' : 'down'}
        />
        <StatCard
          icon="📥"
          label="Income (This Month)"
          value={formatCurrency(summary.income, true)}
          accent="#10b981"
          trend={Number(incomeTrend) >= 0 ? 'up' : 'down'}
          trendLabel={`${Math.abs(incomeTrend)}% vs last month`}
        />
        <StatCard
          icon="📤"
          label="Expenses (This Month)"
          value={formatCurrency(summary.expenses, true)}
          accent="#f43f5e"
          trend={Number(expTrend) <= 0 ? 'up' : 'down'}
          trendLabel={`${Math.abs(expTrend)}% vs last month`}
        />
        <StatCard
          icon="💰"
          label="Savings Rate"
          value={`${summary.savings.toFixed(1)}%`}
          accent="#f59e0b"
          sublabel={`Saved ${formatCurrency(summary.income - summary.expenses, true)}`}
          trend={summary.savings >= 20 ? 'up' : 'down'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: 28 }}>
        {/* Area Chart */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Income vs Expenses</h2>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Last 6 months</span>
          </div>
          <ReactApexChart options={areaOptions} series={areaSeries} type="area" height={240} />
        </div>

        {/* Donut Chart */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Expense Breakdown</h2>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>This month</span>
          </div>
          {catValues.length > 0 ? (
            <ReactApexChart options={donutOptions} series={catValues} type="donut" height={240} />
          ) : (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <div className="empty-state-icon">📊</div>
              <p>No expense data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Budgets + Recent Transactions */}
      <div className="grid-2">
        {/* Budget Overview */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div className="flex-between" style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Budget Overview</h2>
            <Link to="/budgets" style={{ fontSize: '0.78rem', color: 'var(--text-accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {budgetProgress.map((b) => {
              const cat = getCategoryById(b.category);
              return (
                <div key={b.category}>
                  <div className="flex-between" style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{cat.icon}</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>{cat.label}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{formatCurrency(b.spent)}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}> / {formatCurrency(b.amount)}</span>
                    </div>
                  </div>
                  <ProgressBar percent={b.percent} />
                </div>
              );
            })}
            {budgetProgress.length === 0 && (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <p>No budgets set yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div className="flex-between" style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Recent Transactions</h2>
            <Link to="/transactions" style={{ fontSize: '0.78rem', color: 'var(--text-accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {recentTx.map((tx) => {
              const cat = getCategoryById(tx.category);
              return (
                <div key={tx.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: `${cat.color}20`, border: `1px solid ${cat.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, flexShrink: 0,
                    }}>{cat.icon}</div>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.3 }}>{tx.note || cat.label}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{formatDate(tx.date)}</div>
                    </div>
                  </div>
                  <div style={{
                    fontWeight: 700, fontSize: '0.9rem',
                    color: tx.type === 'income' ? 'var(--green)' : 'var(--red)',
                  }}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
