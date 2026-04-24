import ReactApexChart from 'react-apexcharts';
import { useFinanceStore } from '../store/useFinanceStore';
import { getCategoryById } from '../utils/categories';
import { formatCurrency, getMonthKey } from '../utils/formatters';

const CHART_COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#f97316', '#a78bfa', '#ef4444', '#14b8a6'];

export default function Analytics() {
  const getMonthlyData = useFinanceStore((s) => s.getMonthlyData);
  const transactions = useFinanceStore((s) => s.transactions);
  const getTotalBalance = useFinanceStore((s) => s.getTotalBalance);

  const monthly = getMonthlyData();

  // ── 1. Income vs Expenses Bar chart ─────────────────────────────────────────
  const barOptions = {
    chart: { type: 'bar', background: 'transparent', toolbar: { show: false }, animations: { easing: 'easeinout', speed: 700 } },
    colors: ['#10b981', '#f43f5e', '#7c3aed'],
    plotOptions: { bar: { borderRadius: 6, columnWidth: '60%' } },
    xaxis: {
      categories: monthly.map((m) => m.label),
      labels: { style: { colors: '#8892aa', fontSize: '11px' } },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: '#8892aa', fontSize: '11px' }, formatter: (v) => formatCurrency(v, true) } },
    grid: { borderColor: 'rgba(255,255,255,0.06)', strokeDashArray: 4 },
    tooltip: { theme: 'dark', y: { formatter: (v) => formatCurrency(v) } },
    legend: { labels: { colors: '#8892aa' } },
    dataLabels: { enabled: false },
  };

  const barSeries = [
    { name: 'Income',   data: monthly.map((m) => m.income) },
    { name: 'Expenses', data: monthly.map((m) => m.expenses) },
    { name: 'Savings',  data: monthly.map((m) => Math.max(0, m.savings)) },
  ];

  // ── 2. Net Worth line ────────────────────────────────────────────────────────
  let runningBalance = 0;
  const sortedTx = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
  const netWorthPoints = sortedTx.reduce((acc, tx) => {
    runningBalance += tx.type === 'income' ? tx.amount : -tx.amount;
    const last = acc[acc.length - 1];
    if (last && last.x === tx.date) {
      last.y = runningBalance;
    } else {
      acc.push({ x: tx.date, y: runningBalance });
    }
    return acc;
  }, []);

  const lineOptions = {
    chart: { type: 'line', background: 'transparent', toolbar: { show: true, tools: { zoom: true, zoomin: true, zoomout: true, pan: true, reset: true } }, animations: { easing: 'easeinout', speed: 800 } },
    colors: ['#7c3aed'],
    stroke: { curve: 'smooth', width: 2.5 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.02 } },
    markers: { size: 0 },
    xaxis: { type: 'datetime', labels: { style: { colors: '#8892aa', fontSize: '11px' }, datetimeFormatter: { month: "MMM 'yy" } } },
    yaxis: { labels: { style: { colors: '#8892aa', fontSize: '11px' }, formatter: (v) => formatCurrency(v, true) } },
    grid: { borderColor: 'rgba(255,255,255,0.06)', strokeDashArray: 4 },
    tooltip: { theme: 'dark', x: { format: 'dd MMM yyyy' }, y: { formatter: (v) => formatCurrency(v) } },
    dataLabels: { enabled: false },
  };

  const lineSeries = [{ name: 'Net Worth', data: netWorthPoints.map((p) => [new Date(p.x).getTime(), p.y]) }];

  // ── 3. Category spending heatmap-style treemap ───────────────────────────────
  const allExpenses = transactions.filter((t) => t.type === 'expense');
  const categoryTotals = allExpenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});
  const treemapData = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, val]) => ({ x: getCategoryById(cat).label, y: val }));

  const treemapOptions = {
    chart: { type: 'treemap', background: 'transparent', toolbar: { show: false } },
    colors: CHART_COLORS,
    plotOptions: { treemap: { distributed: true, enableShades: false } },
    tooltip: { theme: 'dark', y: { formatter: (v) => formatCurrency(v) } },
    dataLabels: { style: { fontSize: '13px', fontWeight: '600' } },
    legend: { show: false },
  };
  const treemapSeries = [{ data: treemapData }];

  // ── 4. Monthly savings rate line ─────────────────────────────────────────────
  const savingsRateOptions = {
    chart: { type: 'area', background: 'transparent', toolbar: { show: false }, sparkline: { enabled: false } },
    colors: ['#f59e0b'],
    stroke: { curve: 'smooth', width: 2.5 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.02 } },
    xaxis: {
      categories: monthly.map((m) => m.label),
      labels: { style: { colors: '#8892aa', fontSize: '11px' } },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: {
      min: 0, max: 100,
      labels: { style: { colors: '#8892aa', fontSize: '11px' }, formatter: (v) => `${v.toFixed(0)}%` },
    },
    grid: { borderColor: 'rgba(255,255,255,0.06)', strokeDashArray: 4 },
    tooltip: { theme: 'dark', y: { formatter: (v) => `${v.toFixed(1)}%` } },
    dataLabels: { enabled: false },
    annotations: {
      yaxis: [{ y: 20, borderColor: '#10b981', borderWidth: 1, strokeDashArray: 4, label: { text: 'Ideal (20%)', style: { color: '#10b981', background: '#10b98120', fontSize: '10px' } } }],
    },
  };

  const savingsRateSeries = [{
    name: 'Savings Rate',
    data: monthly.map((m) => m.income > 0 ? +((m.savings / m.income) * 100).toFixed(1) : 0),
  }];

  // ── KPI strip ────────────────────────────────────────────────────────────────
  const allIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const allExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const avgMonthlySavings = monthly.reduce((s, m) => s + Math.max(0, m.savings), 0) / (monthly.length || 1);
  const avgSavingsRate = monthly.reduce((s, m) => s + (m.income > 0 ? (m.savings / m.income) * 100 : 0), 0) / (monthly.length || 1);

  return (
    <div className="page-container animate-in">
      <h1 className="page-title" style={{ marginBottom: 8 }}>Analytics</h1>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 24 }}>Deep insights into your financial health</p>

      {/* KPI strip */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 28, flexWrap: 'wrap' }}>
        {[
          { label: 'Lifetime Income', value: formatCurrency(allIncome, true), color: 'var(--green)' },
          { label: 'Lifetime Expenses', value: formatCurrency(allExpense, true), color: 'var(--red)' },
          { label: 'Net Worth', value: formatCurrency(getTotalBalance(), true), color: getTotalBalance() >= 0 ? 'var(--purple)' : 'var(--red)' },
          { label: 'Avg Monthly Savings', value: formatCurrency(avgMonthlySavings, true), color: 'var(--cyan)' },
          { label: 'Avg Savings Rate', value: `${avgSavingsRate.toFixed(1)}%`, color: avgSavingsRate >= 20 ? 'var(--green)' : 'var(--amber)' },
        ].map((k) => (
          <div key={k.label} className="glass-card" style={{ padding: '14px 20px', flex: '1 1 150px' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: k.color, marginTop: 4 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Row 1: Income/Expense bar + Savings Rate */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="glass-card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16 }}>Monthly Income vs Expenses vs Savings</h2>
          <ReactApexChart options={barOptions} series={barSeries} type="bar" height={280} />
        </div>
        <div className="glass-card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 4 }}>Monthly Savings Rate</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 16 }}>Target: ≥ 20% of income</p>
          <ReactApexChart options={savingsRateOptions} series={savingsRateSeries} type="area" height={280} />
        </div>
      </div>

      {/* Row 2: Net Worth + Treemap */}
      <div className="grid-2">
        <div className="glass-card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 4 }}>Net Worth Over Time</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 16 }}>Zoom and pan to explore</p>
          <ReactApexChart options={lineOptions} series={lineSeries} type="area" height={280} />
        </div>
        <div className="glass-card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 4 }}>Expense Distribution</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 16 }}>All-time spending by category</p>
          {treemapData.length > 0 ? (
            <ReactApexChart options={treemapOptions} series={treemapSeries} type="treemap" height={280} />
          ) : (
            <div className="empty-state"><div className="empty-state-icon">📦</div><p>No expense data yet</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
