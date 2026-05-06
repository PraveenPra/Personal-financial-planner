import {
  AlertTriangle,
  BookOpenText,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  HeartPulse,
  LineChart,
  LockKeyhole,
  PiggyBank,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import { useMemo } from 'react';
import CircularProgress from '../components/ui/CircularProgress';
import { useFinanceStore } from '../store/useFinanceStore';
import { generateFinancialReport, getFinancialHealthSummary, getFinancialNarrative } from '../utils/financialHealth';
import { formatCurrency } from '../utils/formatters';

const STATUS_META = {
  critical: { label: 'Critical', color: 'var(--red)', bg: 'var(--red-dim)', icon: AlertTriangle },
  attention: { label: 'Needs Attention', color: 'var(--amber)', bg: 'var(--amber-dim)', icon: AlertTriangle },
  good: { label: 'Good', color: 'var(--green)', bg: 'var(--green-dim)', icon: CheckCircle2 },
};

const LAYER_ICONS = {
  protection: ShieldCheck,
  stability: WalletCards,
  growth: TrendingUp,
  future: Target,
};

const STAGE_ICONS = [AlertTriangle, ShieldCheck, SlidersHorizontal, LineChart, CircleDollarSign];

const REPORT_SECTIONS = [
  { key: 'overview', title: 'Overview', icon: HeartPulse },
  { key: 'foundationAnalysis', title: 'Foundation Analysis', icon: ShieldCheck },
  { key: 'spendingAnalysis', title: 'Spending & Behavior', icon: WalletCards },
  { key: 'riskAnalysis', title: 'Risk Analysis', icon: AlertTriangle },
  { key: 'actionPlan', title: 'Action Plan', icon: ClipboardList },
];

const scoreColor = (score) => {
  if (score < 50) return 'var(--red)';
  if (score < 75) return 'var(--amber)';
  return 'var(--green)';
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.attention;
  const Icon = meta.icon;
  return (
    <span className="health-status-badge" style={{ color: meta.color, background: meta.bg, borderColor: `${meta.color}55` }}>
      <Icon size={13} />
      {meta.label}
    </span>
  );
}

function ToggleField({ label, checked, onChange }) {
  return (
    <label className="health-toggle-row">
      <span>{label}</span>
      <button
        type="button"
        className={`toggle-switch ${checked ? 'active' : ''}`}
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
      >
        <span />
      </button>
    </label>
  );
}

function PriorityLayerCard({ layer }) {
  const Icon = LAYER_ICONS[layer.id] || PiggyBank;
  return (
    <section className={`glass-card priority-card ${layer.status}`} style={{ padding: 22 }}>
      <div className="flex-between" style={{ alignItems: 'flex-start', marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="health-icon-box">
            <Icon size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>{layer.name}</h2>
            <p className="text-xs text-muted">{Math.round(layer.weight * 100)}% score weight</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: scoreColor(layer.score) }}>{layer.score}</div>
          <div className="text-xs text-muted">layer score</div>
        </div>
      </div>

      <div className="health-factor-list">
        {layer.factors.map((item) => (
          <div key={item.id} className="health-factor-row">
            <div>
              <div style={{ fontSize: '0.86rem', fontWeight: 700 }}>{item.label}</div>
              <div className="text-xs text-muted" style={{ marginTop: 3 }}>{item.detail}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7 }}>
              <StatusBadge status={item.status} />
              <span className="text-xs text-secondary">{item.metric}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function FinancialHealth() {
  const transactions = useFinanceStore((s) => s.transactions);
  const budgets = useFinanceStore((s) => s.budgets);
  const goals = useFinanceStore((s) => s.goals);
  const userProfile = useFinanceStore((s) => s.userProfile);
  const updateUserProfile = useFinanceStore((s) => s.updateUserProfile);
  const health = useMemo(
    () => getFinancialHealthSummary({ transactions, budgets, goals, userProfile }),
    [transactions, budgets, goals, userProfile]
  );
  const narrative = useMemo(() => getFinancialNarrative(health), [health]);
  const report = useMemo(
    () => generateFinancialReport(health, { transactions, budgets, goals, userProfile }),
    [health, transactions, budgets, goals, userProfile]
  );

  const criticalItems = health.priorities.filter((item) => item.status === 'critical');
  const ringColor = scoreColor(health.score);

  return (
    <div className="page-container animate-in health-page">
      <section className={`glass-card health-narrative-card ${narrative.tone}`}>
        <div className="health-narrative-icon">
          <HeartPulse size={24} />
        </div>
        <div>
          <div className="label" style={{ marginBottom: 8 }}>Advisor Summary</div>
          <h1>{narrative.headline}</h1>
          <p>{narrative.summary}</p>
          <p>{narrative.insight}</p>
        </div>
      </section>

      <div className="health-top-grid">
        <section className="glass-card health-score-card">
          <div>
            <div className="label" style={{ marginBottom: 10 }}>Financial Health</div>
            <h1 className="page-title">Priority-first money plan</h1>
            <p className="text-secondary" style={{ maxWidth: 560, marginTop: 8 }}>
              The score favors protection first, then stability, growth, and future planning.
            </p>
          </div>
          <CircularProgress percent={health.score} size={170} strokeWidth={14} color={ringColor}>
            <span style={{ fontSize: '2.3rem', fontWeight: 900, color: ringColor, lineHeight: 1 }}>{health.score}</span>
            <span className="text-xs text-muted">out of 100</span>
          </CircularProgress>
          <div className="health-score-meta">
            <div className="health-stage-pill">
              Stage {health.stage.id}: {health.stage.name}
            </div>
            <p className="text-sm text-secondary">{health.stage.description}</p>
          </div>
        </section>

        <section className="glass-card health-actions-card">
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 800 }}>Next Best Actions</h2>
              <p className="text-xs text-muted">Ordered by financial priority</p>
            </div>
            <HeartPulse size={22} color="var(--text-accent)" />
          </div>
          <div className="health-action-list">
            {health.nextActions.slice(0, 5).map((action, index) => (
              <div key={`${action.title}-${index}`} className={`action-item ${action.priority}`}>
                <div className="action-rank">{index + 1}</div>
                <div>
                  <div className="flex" style={{ gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <strong>{action.title}</strong>
                    <StatusBadge status={action.priority} />
                  </div>
                  <p className="text-sm text-secondary" style={{ marginTop: 4 }}>{action.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {criticalItems.length > 0 && (
        <section className="alert-banner">
          <AlertTriangle size={20} />
          <div>
            <strong>{criticalItems.length} critical priority gaps need attention first.</strong>
            <p>
              {criticalItems.slice(0, 3).map((item) => `${item.layerName}: ${item.label}`).join(' | ')}
            </p>
          </div>
        </section>
      )}

      <section className="glass-card financial-report-card">
        <div className="financial-report-header">
          <div className="health-icon-box">
            <BookOpenText size={20} />
          </div>
          <div>
            <h2>Financial Report</h2>
            <p>Advisor-style explanation generated from your live financial data.</p>
          </div>
        </div>

        <div className="financial-report-grid">
          {REPORT_SECTIONS.map(({ key, title, icon: Icon }, index) => (
            <details key={key} className="report-section" open={index < 2}>
              <summary>
                <span>
                  <Icon size={17} />
                  {title}
                </span>
                <span className="report-toggle">Open</span>
              </summary>
              <p>{report[key]}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="glass-card stage-stepper">
        {health.stages.map((stage, index) => {
          const Icon = STAGE_ICONS[index] || Target;
          const active = stage.id === health.stage.id;
          const complete = stage.id < health.stage.id;
          return (
            <div key={stage.id} className={`stage-step ${active ? 'active' : ''} ${complete ? 'complete' : ''}`}>
              <div className="stage-dot">
                <Icon size={17} />
              </div>
              <div>
                <div>Stage {stage.id}</div>
                <strong>{stage.name}</strong>
              </div>
            </div>
          );
        })}
      </section>

      <div className="health-metrics-row">
        <div className="glass-card health-metric">
          <span>Monthly Surplus</span>
          <strong style={{ color: health.metrics.surplus >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {formatCurrency(health.metrics.surplus, true)}
          </strong>
        </div>
        <div className="glass-card health-metric">
          <span>Savings Rate</span>
          <strong>{health.metrics.savingsRate.toFixed(1)}%</strong>
        </div>
        <div className="glass-card health-metric">
          <span>Emergency Fund</span>
          <strong>{health.metrics.emergencyPercent.toFixed(0)}%</strong>
        </div>
        <div className="glass-card health-metric">
          <span>Average Expenses</span>
          <strong>{formatCurrency(health.metrics.averageExpenses, true)}</strong>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 24 }}>
        {health.layers.map((layer) => (
          <PriorityLayerCard key={layer.id} layer={layer} />
        ))}
      </div>

      <section className="glass-card profile-setup">
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 4 }}>Profile Setup</h2>
          <p className="text-xs text-muted">Manual inputs used only where transactions cannot answer the question.</p>
        </div>

        <div className="profile-grid">
          <ToggleField
            label="Health insurance"
            checked={Boolean(userProfile?.hasHealthInsurance)}
            onChange={(value) => updateUserProfile({ hasHealthInsurance: value })}
          />
          <ToggleField
            label="Term insurance"
            checked={Boolean(userProfile?.hasTermInsurance)}
            onChange={(value) => updateUserProfile({ hasTermInsurance: value })}
          />
          <ToggleField
            label="High-interest debt"
            checked={Boolean(userProfile?.hasHighInterestDebt)}
            onChange={(value) => updateUserProfile({ hasHighInterestDebt: value })}
          />
          <div className="form-group">
            <label className="form-label">Dependents</label>
            <input
              type="number"
              min="0"
              value={userProfile?.dependents ?? 0}
              onChange={(event) => updateUserProfile({ dependents: Math.max(0, Number(event.target.value) || 0) })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Emergency fund target: {userProfile?.emergencyFundMonths ?? 3} months</label>
            <input
              type="range"
              min="3"
              max="6"
              step="1"
              value={userProfile?.emergencyFundMonths ?? 3}
              onChange={(event) => updateUserProfile({ emergencyFundMonths: Number(event.target.value) })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Monthly expense override</label>
            <input
              type="number"
              min="0"
              placeholder="Auto-derived"
              value={userProfile?.monthlyExpenseEstimate || ''}
              onChange={(event) => updateUserProfile({ monthlyExpenseEstimate: Number(event.target.value) || 0 })}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
