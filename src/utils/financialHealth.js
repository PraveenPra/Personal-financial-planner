import { getMonthKey } from './formatters';

const LAYER_WEIGHTS = {
  protection: 0.4,
  stability: 0.3,
  growth: 0.2,
  future: 0.1,
};

const DEFAULT_PROFILE = {
  hasHealthInsurance: false,
  hasTermInsurance: false,
  dependents: 0,
  monthlyExpenseEstimate: 0,
  emergencyFundMonths: 3,
  hasHighInterestDebt: false,
};

const STAGES = [
  { id: 0, name: 'Survival', description: 'Cash flow and basic protection need attention.' },
  { id: 1, name: 'Safety', description: 'Building the emergency fund and protection base.' },
  { id: 2, name: 'Control', description: 'Budgeting and stable savings are taking shape.' },
  { id: 3, name: 'Growth', description: 'Protected enough to grow through goals and investing.' },
  { id: 4, name: 'Freedom', description: 'Long-term planning and consistency are in place.' },
];

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, Number(value) || 0));
const round = (value) => Math.round(Number(value) || 0);
const sum = (items) => items.reduce((total, item) => total + (Number(item.amount) || 0), 0);
const statusForScore = (score, criticalBelow = 35, attentionBelow = 70) => {
  if (score < criticalBelow) return 'critical';
  if (score < attentionBelow) return 'attention';
  return 'good';
};

const monthKeyOffset = (offset) => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const currency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(Number(amount) || 0)));

const factor = ({ id, label, score, status, detail, metric, action }) => ({
  id,
  label,
  score: round(clamp(score)),
  status: status || statusForScore(score),
  detail,
  metric,
  action,
});

const layer = ({ id, name, weight, factors }) => {
  const score = factors.length ? factors.reduce((total, item) => total + item.score, 0) / factors.length : 0;
  return {
    id,
    name,
    weight,
    score: round(score),
    status: statusForScore(score),
    factors,
  };
};

const getCurrentMonthSummary = (transactions) => {
  const currentMonth = monthKeyOffset(0);
  const current = transactions.filter((tx) => getMonthKey(tx.date) === currentMonth);
  const income = sum(current.filter((tx) => tx.type === 'income'));
  const expenses = sum(current.filter((tx) => tx.type === 'expense'));
  const surplus = income - expenses;
  const savingsRate = income > 0 ? (surplus / income) * 100 : 0;
  return { currentMonth, income, expenses, surplus, savingsRate };
};

const getMonthlySummaries = (transactions, monthsBack = 6) => {
  const months = Array.from({ length: monthsBack }, (_, index) => monthKeyOffset(index - monthsBack + 1));
  return months.map((month) => {
    const txs = transactions.filter((tx) => getMonthKey(tx.date) === month);
    const income = sum(txs.filter((tx) => tx.type === 'income'));
    const expenses = sum(txs.filter((tx) => tx.type === 'expense'));
    const surplus = income - expenses;
    return {
      month,
      income,
      expenses,
      surplus,
      savingsRate: income > 0 ? (surplus / income) * 100 : 0,
    };
  });
};

const findEmergencyGoal = (goals) =>
  goals.find((goal) => {
    const haystack = `${goal.name || ''} ${goal.icon || ''}`.toLowerCase();
    return haystack.includes('emergency') || haystack.includes('savings') || haystack.includes('rainy');
  });

const evaluateBudgets = (transactions, budgets) => {
  if (!budgets.length) {
    return { score: 0, overspent: [], activeCount: 0, underLimitCount: 0 };
  }

  const currentMonth = monthKeyOffset(0);
  const currentExpenses = transactions.filter((tx) => tx.type === 'expense' && getMonthKey(tx.date) === currentMonth);
  const spendingByCategory = currentExpenses.reduce((totals, tx) => {
    totals[tx.category] = (totals[tx.category] || 0) + (Number(tx.amount) || 0);
    return totals;
  }, {});

  const budgetResults = budgets.map((budget) => {
    const spent = spendingByCategory[budget.category] || 0;
    return { ...budget, spent, overBy: Math.max(0, spent - Number(budget.amount || 0)) };
  });
  const underLimitCount = budgetResults.filter((budget) => budget.overBy <= 0).length;

  return {
    score: (underLimitCount / budgets.length) * 100,
    overspent: budgetResults.filter((budget) => budget.overBy > 0).sort((a, b) => b.overBy - a.overBy),
    activeCount: budgets.length,
    underLimitCount,
  };
};

const evaluateConsistency = (monthlySummaries) => {
  const activeMonths = monthlySummaries.filter((month) => month.income > 0 || month.expenses > 0);
  const lastThree = activeMonths.slice(-3);
  if (lastThree.length < 3) return { score: 35, trend: 'Not enough history yet' };

  const positiveMonths = lastThree.filter((month) => month.surplus > 0).length;
  const rates = lastThree.map((month) => month.savingsRate);
  const spread = Math.max(...rates) - Math.min(...rates);
  const score = clamp((positiveMonths / 3) * 70 + Math.max(0, 30 - spread));
  return {
    score,
    trend: `${positiveMonths}/3 recent months had positive surplus`,
  };
};

export const getFinancialHealthSummary = (state = {}) => {
  const transactions = Array.isArray(state.transactions) ? state.transactions : [];
  const budgets = Array.isArray(state.budgets) ? state.budgets : [];
  const goals = Array.isArray(state.goals) ? state.goals : [];
  const profile = { ...DEFAULT_PROFILE, ...(state.userProfile || {}) };

  const currentSummary = getCurrentMonthSummary(transactions);
  const monthlySummaries = getMonthlySummaries(transactions);
  const activeMonths = monthlySummaries.filter((month) => month.income > 0 || month.expenses > 0);
  const averageExpenses = profile.monthlyExpenseEstimate > 0
    ? Number(profile.monthlyExpenseEstimate)
    : activeMonths.length
      ? sum(activeMonths.map((month) => ({ amount: month.expenses }))) / activeMonths.length
      : currentSummary.expenses;

  const emergencyGoal = findEmergencyGoal(goals);
  const emergencyTarget = Math.max(
    Number(emergencyGoal?.target) || 0,
    averageExpenses * clamp(profile.emergencyFundMonths, 3, 6)
  );
  const emergencySaved = Number(emergencyGoal?.saved) || 0;
  const emergencyPercent = emergencyTarget > 0 ? (emergencySaved / emergencyTarget) * 100 : 0;
  const emergencyMonths = averageExpenses > 0 ? emergencySaved / averageExpenses : 0;

  const termInsuranceScore = Number(profile.dependents) > 0 ? (profile.hasTermInsurance ? 100 : 0) : 100;
  const protectionFactors = [
    factor({
      id: 'emergencyFund',
      label: 'Emergency fund',
      score: emergencyPercent,
      status: emergencyPercent < 50 ? 'critical' : emergencyPercent < 100 ? 'attention' : 'good',
      metric: `${emergencyMonths.toFixed(1)} months covered`,
      detail: emergencyTarget > 0
        ? `${currency(emergencySaved)} saved of ${currency(emergencyTarget)} target`
        : 'Create an emergency fund goal to start tracking protection.',
      action: emergencyTarget > emergencySaved
        ? `Build emergency fund to ${currency(emergencyTarget)}. You have ${currency(emergencySaved)}.`
        : 'Emergency fund target is covered.',
    }),
    factor({
      id: 'healthInsurance',
      label: 'Health insurance',
      score: profile.hasHealthInsurance ? 100 : 0,
      status: profile.hasHealthInsurance ? 'good' : 'critical',
      metric: profile.hasHealthInsurance ? 'Covered' : 'Missing',
      detail: profile.hasHealthInsurance ? 'Manual profile input says coverage is in place.' : 'Medical shocks can derail every other plan.',
      action: profile.hasHealthInsurance ? 'Keep health cover active.' : 'Add health insurance before increasing optional investments.',
    }),
    factor({
      id: 'termInsurance',
      label: 'Term insurance',
      score: termInsuranceScore,
      status: termInsuranceScore === 100 ? 'good' : 'critical',
      metric: Number(profile.dependents) > 0 ? `${profile.dependents} dependents` : 'No dependents',
      detail: Number(profile.dependents) > 0
        ? profile.hasTermInsurance ? 'Dependents are protected by term cover.' : 'Dependents are present but term cover is missing.'
        : 'Skipped because there are no dependents.',
      action: Number(profile.dependents) > 0 && !profile.hasTermInsurance
        ? 'Get term insurance because dependents rely on your income.'
        : 'No term insurance action needed right now.',
    }),
  ];

  const budgetHealth = evaluateBudgets(transactions, budgets);
  const stabilityFactors = [
    factor({
      id: 'savingsRate',
      label: 'Savings rate',
      score: currentSummary.income > 0 ? (currentSummary.savingsRate / 20) * 100 : 0,
      status: currentSummary.income <= 0 || currentSummary.savingsRate < 5 ? 'critical' : currentSummary.savingsRate < 20 ? 'attention' : 'good',
      metric: `${currentSummary.savingsRate.toFixed(1)}%`,
      detail: 'Target savings rate is 20% or higher.',
      action: currentSummary.income > 0
        ? `Increase savings rate from ${currentSummary.savingsRate.toFixed(1)}% to 20%.`
        : 'Add income transactions so savings rate can be measured.',
    }),
    factor({
      id: 'budgetAdherence',
      label: 'Budget adherence',
      score: budgetHealth.score,
      status: budgets.length === 0 ? 'attention' : statusForScore(budgetHealth.score, 50, 80),
      metric: budgets.length ? `${budgetHealth.underLimitCount}/${budgetHealth.activeCount} under limit` : 'No budgets',
      detail: budgets.length
        ? budgetHealth.overspent.length ? `${budgetHealth.overspent.length} budget categories are over limit.` : 'Current budgets are within limits.'
        : 'Set budgets for recurring spending categories.',
      action: budgetHealth.overspent[0]
        ? `Reduce ${budgetHealth.overspent[0].category} spending by ${currency(budgetHealth.overspent[0].overBy)} this month.`
        : budgets.length ? 'Keep current budget discipline.' : 'Create budgets for rent, food, transport, and utilities.',
    }),
    factor({
      id: 'highInterestDebt',
      label: 'High-interest debt',
      score: profile.hasHighInterestDebt ? 0 : 100,
      status: profile.hasHighInterestDebt ? 'critical' : 'good',
      metric: profile.hasHighInterestDebt ? 'Flagged' : 'None flagged',
      detail: profile.hasHighInterestDebt ? 'High-interest debt beats most investment returns.' : 'No high-interest debt flag is active.',
      action: profile.hasHighInterestDebt ? 'Prioritize high-interest debt payoff before growth goals.' : 'No debt payoff blocker detected.',
    }),
  ];

  const activeGoalCount = goals.filter((goal) => Number(goal.target) > Number(goal.saved || 0)).length;
  const goalProgress = goals.length
    ? goals.reduce((total, goal) => total + clamp((Number(goal.saved || 0) / Math.max(1, Number(goal.target || 0))) * 100), 0) / goals.length
    : 0;
  const hasInvesting = transactions.some((tx) => {
    const text = `${tx.category || ''} ${tx.note || ''}`.toLowerCase();
    return text.includes('investment') || text.includes('sip') || text.includes('mutual') || text.includes('stock');
  });

  const growthFactors = [
    factor({
      id: 'activeGoals',
      label: 'Active savings goals',
      score: goals.length ? Math.max(40, goalProgress) : 0,
      status: goals.length ? statusForScore(Math.max(40, goalProgress), 35, 70) : 'attention',
      metric: goals.length ? `${activeGoalCount} active` : 'No goals',
      detail: goals.length ? `Average goal progress is ${goalProgress.toFixed(0)}%.` : 'Goals convert surplus into decisions.',
      action: goals.length ? 'Keep funding active savings goals.' : 'Create one short-term savings goal after protection is stable.',
    }),
    factor({
      id: 'surplusMoney',
      label: 'Monthly surplus',
      score: currentSummary.income > 0 ? clamp((currentSummary.surplus / (currentSummary.income * 0.2)) * 100) : 0,
      status: currentSummary.surplus <= 0 ? 'critical' : currentSummary.savingsRate < 20 ? 'attention' : 'good',
      metric: currency(currentSummary.surplus),
      detail: currentSummary.surplus > 0 ? 'This month has positive cash flow.' : 'Expenses are equal to or higher than income.',
      action: currentSummary.surplus > 0 ? 'Route monthly surplus toward the highest priority gap.' : 'Cut non-essential expenses until monthly surplus is positive.',
    }),
    factor({
      id: 'investingBehavior',
      label: 'Investing behavior',
      score: hasInvesting ? 100 : 25,
      status: hasInvesting ? 'good' : 'attention',
      metric: hasInvesting ? 'Detected' : 'Not detected',
      detail: hasInvesting ? 'Investment-like transactions are present.' : 'No investment transactions found yet.',
      action: hasInvesting ? 'Keep investing aligned with goals.' : 'Start investing only after protection is no longer weak.',
    }),
  ];

  const longTermGoals = goals.filter((goal) => {
    if (!goal.deadline) return false;
    const deadline = new Date(goal.deadline);
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    const text = `${goal.name || ''} ${goal.icon || ''}`.toLowerCase();
    return deadline > oneYearFromNow || text.includes('retire') || text.includes('car') || text.includes('home');
  });
  const consistency = evaluateConsistency(monthlySummaries);
  const futureFactors = [
    factor({
      id: 'longTermGoals',
      label: 'Long-term goals',
      score: longTermGoals.length ? 100 : goals.length ? 45 : 0,
      status: longTermGoals.length ? 'good' : goals.length ? 'attention' : 'critical',
      metric: longTermGoals.length ? `${longTermGoals.length} long-term` : 'None',
      detail: longTermGoals.length ? 'At least one long-term goal is being tracked.' : 'Retirement or major long-term goals are not represented yet.',
      action: longTermGoals.length ? 'Review long-term goal funding quarterly.' : 'Add a retirement or large future goal once protection is stable.',
    }),
    factor({
      id: 'consistency',
      label: 'Consistency over time',
      score: consistency.score,
      status: statusForScore(consistency.score, 40, 70),
      metric: consistency.trend,
      detail: 'Based on the last three months with transaction activity.',
      action: consistency.score >= 70 ? 'Maintain the current savings rhythm.' : 'Aim for three straight months of positive surplus.',
    }),
  ];

  const layers = [
    layer({ id: 'protection', name: 'Protection', weight: LAYER_WEIGHTS.protection, factors: protectionFactors }),
    layer({ id: 'stability', name: 'Stability', weight: LAYER_WEIGHTS.stability, factors: stabilityFactors }),
    layer({ id: 'growth', name: 'Growth', weight: LAYER_WEIGHTS.growth, factors: growthFactors }),
    layer({ id: 'future', name: 'Future', weight: LAYER_WEIGHTS.future, factors: futureFactors }),
  ];

  const protectionWeak = emergencyPercent < 50 || !profile.hasHealthInsurance || (Number(profile.dependents) > 0 && !profile.hasTermInsurance);
  const score = round(layers.reduce((total, item) => total + item.score * item.weight, 0));
  const priorities = layers.flatMap((item) =>
    item.factors.map((itemFactor) => ({
      ...itemFactor,
      layerId: item.id,
      layerName: item.name,
    }))
  );

  const stageId = (() => {
    if (currentSummary.surplus <= 0 || emergencySaved <= 0) return 0;
    if (emergencyPercent < 50 || currentSummary.savingsRate < 10) return 1;
    if (emergencyPercent < 100 || currentSummary.savingsRate < 20 || budgets.length === 0) return 2;
    if (hasInvesting && goals.length > 0 && !protectionWeak) {
      return layers.every((item) => item.score >= 70) && longTermGoals.length > 0 ? 4 : 3;
    }
    return 2;
  })();

  const blockedGrowthMessage = protectionWeak
    ? 'Avoid adding new investment commitments until emergency fund and insurance gaps are handled.'
    : null;

  const protectionActions = priorities
    .filter((item) => item.layerId === 'protection' && item.status !== 'good')
    .map((item) => ({ title: item.label, description: item.action, priority: item.status, layer: item.layerName }));
  const stabilityActions = priorities
    .filter((item) => item.layerId === 'stability' && item.status !== 'good')
    .map((item) => ({ title: item.label, description: item.action, priority: item.status, layer: item.layerName }));
  const laterActions = protectionWeak
    ? []
    : priorities
      .filter((item) => ['growth', 'future'].includes(item.layerId) && item.status !== 'good')
      .map((item) => ({ title: item.label, description: item.action, priority: item.status, layer: item.layerName }));

  const nextActions = [
    ...protectionActions,
    ...(blockedGrowthMessage ? [{ title: 'Investment guardrail', description: blockedGrowthMessage, priority: 'critical', layer: 'Protection' }] : []),
    ...stabilityActions,
    ...laterActions,
  ].slice(0, 5);

  if (!nextActions.length) {
    nextActions.push({
      title: 'Maintain momentum',
      description: 'Your core financial layers look healthy. Review goals and insurance once a quarter.',
      priority: 'good',
      layer: 'Future',
    });
  }

  const insights = [
    `Current savings rate is ${currentSummary.savingsRate.toFixed(1)}% against a 20% target.`,
    `Emergency fund covers ${emergencyMonths.toFixed(1)} months of expenses.`,
    protectionWeak
      ? 'Growth suggestions are intentionally deprioritized because protection is weak.'
      : 'Protection is strong enough for controlled growth planning.',
  ];

  return {
    score: clamp(score),
    stage: STAGES[stageId],
    stages: STAGES,
    priorities,
    layers,
    insights,
    nextActions,
    metrics: {
      income: currentSummary.income,
      expenses: currentSummary.expenses,
      surplus: currentSummary.surplus,
      savingsRate: currentSummary.savingsRate,
      averageExpenses,
      emergencyTarget,
      emergencySaved,
      emergencyPercent: clamp(emergencyPercent),
      emergencyMonths,
      protectionWeak,
    },
  };
};

