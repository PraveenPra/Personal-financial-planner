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
  RefreshCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import CircularProgress from '../components/ui/CircularProgress';
import { useFinanceStore } from '../store/useFinanceStore';
import {
  generateFinancialReport,
  getExplanation,
  getFinancialHealthSummary,
  getFinancialNarrative,
  simulateFinancialChange,
} from '../utils/financialHealth';
import { EXPENSE_CATEGORIES } from '../utils/categories';
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

const EXPLANATION_TYPES = {
  emergencyFund: 'emergency_fund',
  healthInsurance: 'health_insurance',
  termInsurance: 'term_insurance',
  savingsRate: 'savings_rate',
  highInterestDebt: 'high_interest_debt',
  budgetAdherence: 'budget_adherence',
  investingBehavior: 'investing',
};

const scoreColor = (score) => {
  if (score < 50) return 'var(--red)';
  if (score < 75) return 'var(--amber)';
  return 'var(--green)';
};

const actionToExplanationItem = (action) => {
  const title = `${action?.title || ''} ${action?.description || ''}`.toLowerCase();
  if (title.includes('emergency')) return { id: 'emergencyFund', label: 'Emergency fund' };
  if (title.includes('health')) return { id: 'healthInsurance', label: 'Health insurance' };
  if (title.includes('term')) return { id: 'termInsurance', label: 'Term insurance' };
  if (title.includes('savings rate')) return { id: 'savingsRate', label: 'Savings rate' };
  if (title.includes('budget') || title.includes('spending') || title.includes('expense')) return { id: 'budgetAdherence', label: 'Budget discipline' };
  if (title.includes('debt')) return { id: 'highInterestDebt', label: 'High-interest debt' };
  if (title.includes('investment') || title.includes('invest')) return { id: 'investingBehavior', label: 'Investing behavior' };
  return { id: 'general', label: action?.title || 'This recommendation' };
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

function PriorityLayerCard({ layer, onExplain }) {
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
              <button
                type="button"
                className="explain-link"
                onClick={() => onExplain(item)}
                aria-label={`Explain ${item.label}`}
              >
                Why this matters
              </button>
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

function ExplanationModal({ explanation, onClose }) {
  if (!explanation) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box explain-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="label">Explain This</div>
            <h2 className="modal-title">{explanation.label}</h2>
          </div>
          <button className="btn-icon" type="button" onClick={onClose} aria-label="Close explanation">x</button>
        </div>
        <div className="explain-block">
          <strong>Why this matters</strong>
          <p>{explanation.why}</p>
        </div>
        <div className="explain-block warning">
          <strong>What happens if ignored</strong>
          <p>{explanation.ignored}</p>
        </div>
      </div>
    </div>
  );
}

function WhatIfPlanner({ state, health }) {
  const emergencyGap = Math.max(0, (health.metrics.emergencyTarget || 0) - (health.metrics.emergencySaved || 0));
  const defaultCategory = EXPENSE_CATEGORIES[0]?.id || 'food';
  const [scenario, setScenario] = useState({
    addSavings: 0,
    reduceExpense: { category: defaultCategory, amount: 0 },
    increaseIncome: 0,
    addInvestment: 0,
    increaseHealthCoverage: 0,
    increaseTermCoverage: 0,
    reduceEmi: 0,
  });

  const simulation = useMemo(
    () => simulateFinancialChange(state, scenario),
    [state, scenario]
  );
  const scoreDelta = simulation.deltas.scoreChange;
  const scoreTone = scoreDelta > 0 ? 'good' : scoreDelta < 0 ? 'critical' : 'neutral';
  const investmentRisk = health.metrics.protectionWeak && Number(scenario.addInvestment) > 0;
  const maxSavings = Math.max(50000, Math.ceil(emergencyGap / 10000) * 10000, 100000);
  const maxExpenseCut = Math.max(10000, Math.ceil((health.metrics.expenses || 0) / 10000) * 10000);

  const updateScenario = (updates) => setScenario((current) => ({ ...current, ...updates }));
  const resetScenario = () => setScenario({
    addSavings: 0,
    reduceExpense: { category: defaultCategory, amount: 0 },
    increaseIncome: 0,
    addInvestment: 0,
    increaseHealthCoverage: 0,
    increaseTermCoverage: 0,
    reduceEmi: 0,
  });

  const completeEmergencyFund = () => updateScenario({ addSavings: Math.round(emergencyGap) });
  const cutExpenses = () => updateScenario({
    reduceExpense: {
      ...scenario.reduceExpense,
      amount: Math.round((health.metrics.expenses || 0) * 0.2),
    },
  });
  const startSip = () => updateScenario({ addInvestment: 5000 });

  return (
    <section className="what-if-planner">
      <div className="what-if-header">
        <div>
          <div className="label">Scenario Simulator</div>
          <h2>What If Planner</h2>
          <p>Experiment with decisions. Your real data stays untouched.</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={resetScenario}>
          <RefreshCcw size={14} />
          Reset
        </button>
      </div>

      <div className="what-if-layout">
        <div className="glass-card simulator-controls">
          <div className="preset-row">
            <button className="scenario-preset" onClick={completeEmergencyFund}>Complete Emergency Fund</button>
            <button className="scenario-preset" onClick={cutExpenses}>Cut 20% Expenses</button>
            <button className="scenario-preset" onClick={startSip}>Start ₹5k SIP</button>
          </div>

          <div className="sim-control">
            <div className="flex-between">
              <span>Savings Booster</span>
              <strong>+{formatCurrency(scenario.addSavings)}</strong>
            </div>
            <input
              type="range"
              min="0"
              max={maxSavings}
              step="5000"
              value={scenario.addSavings}
              onChange={(event) => updateScenario({ addSavings: Number(event.target.value) })}
            />
            <p>Add money to your emergency fund.</p>
          </div>

          <div className="sim-control">
            <div className="flex-between">
              <span>Expense Optimizer</span>
              <strong>{formatCurrency(scenario.reduceExpense.amount)}</strong>
            </div>
            <select
              value={scenario.reduceExpense.category}
              onChange={(event) => updateScenario({ reduceExpense: { ...scenario.reduceExpense, category: event.target.value } })}
            >
              {EXPENSE_CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>{category.label}</option>
              ))}
            </select>
            <input
              type="range"
              min="0"
              max={maxExpenseCut}
              step="1000"
              value={scenario.reduceExpense.amount}
              onChange={(event) => updateScenario({ reduceExpense: { ...scenario.reduceExpense, amount: Number(event.target.value) } })}
            />
            <p>{scenario.reduceExpense.category} reduced by {formatCurrency(scenario.reduceExpense.amount)}.</p>
          </div>

          <div className="sim-control">
            <div className="flex-between">
              <span>Income Increase</span>
              <strong>+{formatCurrency(scenario.increaseIncome)}</strong>
            </div>
            <input
              type="range"
              min="0"
              max="100000"
              step="5000"
              value={scenario.increaseIncome}
              onChange={(event) => updateScenario({ increaseIncome: Number(event.target.value) })}
            />
            <p>Model extra monthly income.</p>
          </div>

          <div className={`sim-control ${health.metrics.protectionWeak ? 'guarded' : ''}`}>
            <div className="flex-between">
              <span>Investment Add</span>
              <strong>{formatCurrency(scenario.addInvestment)}/mo</strong>
            </div>
            <input
              type="range"
              min="0"
              max="50000"
              step="2500"
              value={scenario.addInvestment}
              onChange={(event) => updateScenario({ addInvestment: Number(event.target.value) })}
            />
            <p>{health.metrics.protectionWeak ? 'Complete basics first. You can still simulate the impact.' : 'Model a monthly SIP or investment contribution.'}</p>
          </div>

          <div className="sim-control">
            <div className="flex-between">
              <span>Insurance Upgrade</span>
              <strong>+{formatCurrency(scenario.increaseHealthCoverage)}</strong>
            </div>
            <input
              type="range"
              min="0"
              max="1500000"
              step="100000"
              value={scenario.increaseHealthCoverage}
              onChange={(event) => updateScenario({ increaseHealthCoverage: Number(event.target.value) })}
            />
            <p>Increase health cover and see foundation risk change.</p>
          </div>

          <div className="sim-control">
            <div className="flex-between">
              <span>Term Cover Boost</span>
              <strong>+{formatCurrency(scenario.increaseTermCoverage)}</strong>
            </div>
            <input
              type="range"
              min="0"
              max="10000000"
              step="500000"
              value={scenario.increaseTermCoverage}
              onChange={(event) => updateScenario({ increaseTermCoverage: Number(event.target.value) })}
            />
            <p>Model extra life cover for dependents.</p>
          </div>

          <div className="sim-control">
            <div className="flex-between">
              <span>EMI Relief</span>
              <strong>-{formatCurrency(scenario.reduceEmi)}</strong>
            </div>
            <input
              type="range"
              min="0"
              max="50000"
              step="1000"
              value={scenario.reduceEmi}
              onChange={(event) => updateScenario({ reduceEmi: Number(event.target.value) })}
            />
            <p>Simulate lowering monthly loan obligations.</p>
          </div>
        </div>

        <div className={`glass-card simulator-impact ${scoreTone}`}>
          <div className="impact-score">
            <span>{health.score}</span>
            <strong>→</strong>
            <span>{simulation.newScore}</span>
          </div>
          <div className={`impact-delta ${scoreTone}`}>
            {scoreDelta > 0 ? '+' : ''}{scoreDelta} score change
          </div>

          <div className="stage-change">
            <div>
              <span>Current stage</span>
              <strong>{health.stage.name}</strong>
            </div>
            <Sparkles size={18} />
            <div>
              <span>After scenario</span>
              <strong>{simulation.newStage.name}</strong>
            </div>
          </div>

          <div className="updated-advice">
            <h3>Updated Advice</h3>
            {simulation.newActions.slice(0, 3).map((action, index) => (
              <p key={`${action.title}-${index}`}>{action.description}</p>
            ))}
          </div>

          <div className={`risk-indicator ${simulation.summary.metrics.protectionWeak ? 'critical' : 'good'}`}>
            {simulation.summary.metrics.protectionWeak ? 'Still missing foundation protection' : 'Risk reduced: foundation looks stronger'}
          </div>

          {investmentRisk && (
            <div className="guardrail-warning">
              This increases your risk because your emergency fund or insurance foundation is incomplete.
            </div>
          )}
          {simulation.warnings?.slice(0, 2).map((warning) => (
            <div key={warning} className="guardrail-warning">{warning}</div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function FinancialHealth() {
  const transactions = useFinanceStore((s) => s.transactions);
  const budgets = useFinanceStore((s) => s.budgets);
  const goals = useFinanceStore((s) => s.goals);
  const financialProfile = useFinanceStore((s) => s.financialProfile);
  const updateFinancialProfile = useFinanceStore((s) => s.updateFinancialProfile);
  const toggleFinancialMode = useFinanceStore((s) => s.toggleFinancialMode);
  const [explanation, setExplanation] = useState(null);
  const financeState = useMemo(
    () => ({ transactions, budgets, goals, financialProfile }),
    [transactions, budgets, goals, financialProfile]
  );
  const health = useMemo(
    () => getFinancialHealthSummary(financeState),
    [financeState]
  );
  const narrative = useMemo(() => getFinancialNarrative(health), [health]);
  const report = useMemo(
    () => generateFinancialReport(health, financeState),
    [health, financeState]
  );

  const criticalItems = health.priorities.filter((item) => item.status === 'critical');
  const ringColor = scoreColor(health.score);
  const isAdvisor = (financialProfile?.mode || 'simple') === 'advisor';
  const openExplanation = (item) => {
    const detail = getExplanation(EXPLANATION_TYPES[item.id] || 'general', {
      protectionWeak: health.metrics.protectionWeak,
    });
    setExplanation({
      label: item.label,
      why: detail.why,
      ignored: detail.ignored,
    });
  };

  return (
    <>
    <div className="page-container animate-in health-page">
      <div className="health-mode-bar">
        <div>
          <div className="label">View Mode</div>
          <strong>{isAdvisor ? 'Advisor Mode' : 'Simple Mode'}</strong>
        </div>
        <button className={`mode-toggle ${isAdvisor ? 'advisor' : ''}`} onClick={toggleFinancialMode}>
          <span>Simple</span>
          <span>Advisor</span>
        </button>
      </div>

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
            {health.nextActions.slice(0, isAdvisor ? 5 : 3).map((action, index) => (
              <div key={`${action.title}-${index}`} className={`action-item ${action.priority}`}>
                <div className="action-rank">{index + 1}</div>
                <div>
                  <div className="flex" style={{ gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <strong>{action.title}</strong>
                    <StatusBadge status={action.priority} />
                  </div>
                  <p className="text-sm text-secondary" style={{ marginTop: 4 }}>{action.description}</p>
                  <button
                    type="button"
                    className="explain-link"
                    onClick={() => openExplanation(actionToExplanationItem(action))}
                  >
                    Why this matters
                  </button>
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

      {isAdvisor && (
        <>
          <WhatIfPlanner state={financeState} health={health} />

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
        </>
      )}

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

      {isAdvisor && (
        <div className="grid-2" style={{ marginTop: 24 }}>
          {health.layers.map((layer) => (
            <PriorityLayerCard key={layer.id} layer={layer} onExplain={openExplanation} />
          ))}
        </div>
      )}

      <section className="glass-card profile-setup">
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 4 }}>Financial Planning Workspace</h2>
            <p className="text-xs text-muted">Structured financial life data used by reports, scenarios, and advisor logic.</p>
          </div>

          <div className="profile-grid">
            <ToggleField
              label="Health insurance"
              checked={Boolean(financialProfile?.protection?.healthInsurance?.hasCoverage)}
              onChange={(value) => updateFinancialProfile({ protection: { healthInsurance: { hasCoverage: value } } })}
            />
            <ToggleField
              label="Term insurance"
              checked={Boolean(financialProfile?.protection?.termInsurance?.hasCoverage)}
              onChange={(value) => updateFinancialProfile({ protection: { termInsurance: { hasCoverage: value } } })}
            />
            <ToggleField
              label="High-interest debt"
              checked={Boolean(financialProfile?.debt?.hasHighInterestDebt)}
              onChange={(value) => updateFinancialProfile({ debt: { hasHighInterestDebt: value } })}
            />
            <div className="form-group">
              <label className="form-label">Dependents</label>
              <input
                type="number"
                min="0"
                value={financialProfile?.family?.dependents ?? 0}
                onChange={(event) => updateFinancialProfile({ family: { dependents: Math.max(0, Number(event.target.value) || 0) } })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Emergency fund target: {financialProfile?.protection?.emergencyFundTargetMonths ?? 3} months</label>
              <input
                type="range"
                min="3"
                max="6"
                step="1"
                value={financialProfile?.protection?.emergencyFundTargetMonths ?? 3}
                onChange={(event) => updateFinancialProfile({ protection: { emergencyFundTargetMonths: Number(event.target.value) } })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Monthly expense override</label>
              <input
                type="number"
                min="0"
                placeholder="Auto-derived"
                value={financialProfile?.monthlyExpenseEstimate || ''}
                onChange={(event) => updateFinancialProfile({ monthlyExpenseEstimate: Number(event.target.value) || 0 })}
              />
            </div>
          </div>

          {isAdvisor && (
          <div className="planning-advanced-grid">
            <details className="planning-panel" open>
              <summary>Protection Details</summary>
              <div className="profile-grid">
                <div className="form-group">
                  <label className="form-label">Health cover amount</label>
                  <input
                    type="number"
                    min="0"
                    value={financialProfile?.protection?.healthInsurance?.coverageAmount ?? 0}
                    onChange={(event) => updateFinancialProfile({ protection: { healthInsurance: { coverageAmount: Number(event.target.value) || 0 } } })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Health premium/month</label>
                  <input
                    type="number"
                    min="0"
                    value={financialProfile?.protection?.healthInsurance?.monthlyPremium ?? 0}
                    onChange={(event) => updateFinancialProfile({ protection: { healthInsurance: { monthlyPremium: Number(event.target.value) || 0 } } })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Term cover amount</label>
                  <input
                    type="number"
                    min="0"
                    value={financialProfile?.protection?.termInsurance?.coverageAmount ?? 0}
                    onChange={(event) => updateFinancialProfile({ protection: { termInsurance: { coverageAmount: Number(event.target.value) || 0 } } })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Term premium/month</label>
                  <input
                    type="number"
                    min="0"
                    value={financialProfile?.protection?.termInsurance?.monthlyPremium ?? 0}
                    onChange={(event) => updateFinancialProfile({ protection: { termInsurance: { monthlyPremium: Number(event.target.value) || 0 } } })}
                  />
                </div>
              </div>
            </details>

            <details className="planning-panel">
              <summary>Loans & Investments</summary>
              <div className="profile-grid">
                <div className="form-group">
                  <label className="form-label">Primary loan EMI</label>
                  <input
                    type="number"
                    min="0"
                    value={financialProfile?.debt?.loans?.[0]?.emi ?? 0}
                    onChange={(event) => updateFinancialProfile({
                      debt: {
                        loans: [{
                          ...(financialProfile?.debt?.loans?.[0] || { id: 'primary-loan', type: 'personal', interestRate: 12, remainingTenureMonths: 24 }),
                          emi: Number(event.target.value) || 0,
                        }],
                      },
                    })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Loan interest rate</label>
                  <input
                    type="number"
                    min="0"
                    value={financialProfile?.debt?.loans?.[0]?.interestRate ?? 0}
                    onChange={(event) => updateFinancialProfile({
                      debt: {
                        loans: [{
                          ...(financialProfile?.debt?.loans?.[0] || { id: 'primary-loan', type: 'personal', emi: 0, remainingTenureMonths: 24 }),
                          interestRate: Number(event.target.value) || 0,
                        }],
                      },
                    })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Monthly SIP/investment</label>
                  <input
                    type="number"
                    min="0"
                    value={financialProfile?.investments?.monthlyInvestmentAmount ?? 0}
                    onChange={(event) => updateFinancialProfile({ investments: { monthlyInvestmentAmount: Number(event.target.value) || 0 } })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Investment type</label>
                  <select
                    value={financialProfile?.investments?.investmentTypes?.[0] || 'mutual_funds'}
                    onChange={(event) => updateFinancialProfile({ investments: { investmentTypes: [event.target.value] } })}
                  >
                    <option value="mutual_funds">Mutual funds</option>
                    <option value="stocks">Stocks</option>
                    <option value="fixed_income">Fixed income</option>
                    <option value="retirement">Retirement</option>
                  </select>
                </div>
              </div>
            </details>
          </div>
          )}
        </section>

    </div>
    <ExplanationModal explanation={explanation} onClose={() => setExplanation(null)} />
    </>
  );
}
