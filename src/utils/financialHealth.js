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

const signedCurrency = (amount) => {
  const value = Number(amount) || 0;
  const formatted = currency(Math.abs(value));
  return value < 0 ? `-${formatted}` : formatted;
};

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

const todayISO = () => new Date().toISOString().split('T')[0];

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
  const warnings = [
    ...(emergencyPercent < 50 ? ['Not recommended to invest yet - emergency fund is below 50%.'] : []),
    ...(!profile.hasHealthInsurance ? ['Growth plans are fragile until health insurance is in place.'] : []),
    ...(Number(profile.dependents) > 0 && !profile.hasTermInsurance ? ['Dependents are exposed until term insurance is in place.'] : []),
    ...(profile.hasHighInterestDebt ? ['Pay high-interest debt before adding new growth commitments.'] : []),
  ];

  return {
    score: clamp(score),
    stage: STAGES[stageId],
    stages: STAGES,
    priorities,
    layers,
    insights,
    warnings,
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

const cloneStateForSimulation = (state = {}) => ({
  ...state,
  transactions: Array.isArray(state.transactions) ? state.transactions.map((tx) => ({ ...tx })) : [],
  budgets: Array.isArray(state.budgets) ? state.budgets.map((budget) => ({ ...budget })) : [],
  goals: Array.isArray(state.goals) ? state.goals.map((goal) => ({ ...goal })) : [],
  userProfile: { ...(state.userProfile || {}) },
});

const reduceCurrentMonthExpense = (transactions, category, amount) => {
  let remaining = Math.max(0, Number(amount) || 0);
  const currentMonth = monthKeyOffset(0);
  return transactions.map((tx) => {
    if (remaining <= 0 || tx.type !== 'expense' || tx.category !== category || getMonthKey(tx.date) !== currentMonth) {
      return tx;
    }
    const reduction = Math.min(Number(tx.amount) || 0, remaining);
    remaining -= reduction;
    return { ...tx, amount: Math.max(0, (Number(tx.amount) || 0) - reduction) };
  });
};

export const simulateFinancialChange = (state = {}, scenario = {}) => {
  const baseSummary = getFinancialHealthSummary(state);
  const simulatedState = cloneStateForSimulation(state);
  const emergencyGoal = findEmergencyGoal(simulatedState.goals);

  if ((Number(scenario.addSavings) || 0) > 0) {
    if (emergencyGoal) {
      emergencyGoal.saved = Math.min(
        Math.max(Number(emergencyGoal.target) || 0, Number(baseSummary.metrics?.emergencyTarget) || 0),
        (Number(emergencyGoal.saved) || 0) + Number(scenario.addSavings)
      );
    } else {
      simulatedState.goals.push({
        id: `scenario-emergency-${Date.now()}`,
        name: 'Emergency Fund',
        icon: 'savings',
        target: Number(baseSummary.metrics?.emergencyTarget) || Number(scenario.addSavings),
        saved: Number(scenario.addSavings),
        deadline: todayISO(),
        color: '#f59e0b',
      });
    }
  }

  if (scenario.reduceExpense?.category && (Number(scenario.reduceExpense.amount) || 0) > 0) {
    simulatedState.transactions = reduceCurrentMonthExpense(
      simulatedState.transactions,
      scenario.reduceExpense.category,
      Number(scenario.reduceExpense.amount)
    );
  }

  if ((Number(scenario.increaseIncome) || 0) > 0) {
    simulatedState.transactions.unshift({
      id: `scenario-income-${Date.now()}`,
      type: 'income',
      category: 'other_inc',
      amount: Number(scenario.increaseIncome),
      note: 'Scenario income increase',
      date: todayISO(),
    });
  }

  if ((Number(scenario.addInvestment) || 0) > 0) {
    simulatedState.transactions.unshift({
      id: `scenario-investment-${Date.now()}`,
      type: 'expense',
      category: 'investment',
      amount: Number(scenario.addInvestment),
      note: 'Scenario SIP investment',
      date: todayISO(),
    });
  }

  const newSummary = getFinancialHealthSummary(simulatedState);
  const stageChange = (newSummary.stage?.id ?? 0) - (baseSummary.stage?.id ?? 0);

  return {
    newScore: newSummary.score,
    newStage: newSummary.stage,
    newActions: newSummary.nextActions,
    warnings: newSummary.warnings,
    summary: newSummary,
    deltas: {
      scoreChange: Math.round((newSummary.score || 0) - (baseSummary.score || 0)),
      stageChange,
    },
  };
};

export const getExplanation = (type = 'general', context = {}) => {
  const safeType = typeof type === 'string' && type ? type : 'general';
  const explanations = {
    emergency_fund: {
      why: 'An emergency fund is money set aside for surprises like job loss, repairs, or medical costs.',
      ignored: 'Without it, even a small unexpected expense can force you into debt and delay every other goal.',
    },
    health_insurance: {
      why: 'Health insurance protects your savings from large medical bills.',
      ignored: 'If ignored, one hospital bill can wipe out months or years of savings.',
    },
    term_insurance: {
      why: 'Term insurance protects people who depend on your income.',
      ignored: 'If ignored, your family may struggle financially if your income suddenly stops.',
    },
    savings_rate: {
      why: 'Savings rate shows how much of your income is left after expenses.',
      ignored: 'If it stays low, goals may look active but grow too slowly to matter.',
    },
    high_interest_debt: {
      why: 'High-interest debt grows faster than most normal investments.',
      ignored: 'If ignored, interest payments can consume money that should go toward savings and goals.',
    },
    budget_adherence: {
      why: 'Budgets show whether spending matches the plan you set for yourself.',
      ignored: 'If ignored, small overspending patterns can quietly remove your monthly surplus.',
    },
    investing: {
      why: 'Investing helps grow money over time after the foundation is secure.',
      ignored: context.protectionWeak
        ? 'Investing too early can create risk because you may need to sell investments during an emergency.'
        : 'If ignored for too long, long-term wealth building may start later than it needs to.',
    },
  };

  const selected = explanations[safeType] || {
    why: 'This factor affects how stable and flexible your financial plan is.',
    ignored: 'If ignored, it can make other goals harder to reach.',
  };

  return {
    title: safeType.split('_').map((word) => word[0].toUpperCase() + word.slice(1)).join(' '),
    why: selected.why,
    ignored: selected.ignored,
  };
};

export const getFinancialNarrative = (summary = {}) => {
  const priorities = Array.isArray(summary.priorities) ? summary.priorities : [];
  const nextActions = Array.isArray(summary.nextActions) ? summary.nextActions : [];
  const criticalItems = priorities.filter((item) => item.status === 'critical');
  const warningItems = priorities.filter((item) => item.status === 'attention');
  const protectionWeak = Boolean(summary.metrics?.protectionWeak);
  const stageName = summary.stage?.name || 'your current stage';
  const topAction = nextActions[0]?.description || 'Keep tracking your money and review your plan regularly.';

  if (criticalItems.length > 0) {
    const missing = criticalItems.slice(0, 2).map((item) => item.label.toLowerCase()).join(' and ');
    return {
      headline: "You're missing some financial basics",
      summary: `You are in Stage ${summary.stage?.id ?? 0}: ${stageName}, and ${missing || 'a few essentials'} need attention first.`,
      insight: protectionWeak
        ? 'Before thinking about investing, focus on your safety buffer and insurance gaps.'
        : topAction,
      tone: 'critical',
    };
  }

  if (warningItems.length > 0) {
    const firstWarning = warningItems[0]?.label.toLowerCase() || 'one area';
    return {
      headline: "You're on the right track, but not fully stable yet",
      summary: `Your basics are not in danger, but ${firstWarning} still needs work before the plan feels steady.`,
      insight: protectionWeak
        ? 'Complete your emergency fund before moving into new investments.'
        : topAction,
      tone: 'warning',
    };
  }

  return {
    headline: "You're in a strong financial position",
    summary: `You are in Stage ${summary.stage?.id ?? 0}: ${stageName}, with solid savings habits and no major priority gaps showing.`,
    insight: 'You can now focus on growing your wealth through investments and long-term planning.',
    tone: 'good',
  };
};

const getTopExpenseCategories = (transactions = []) => {
  const currentMonth = monthKeyOffset(0);
  const totals = transactions
    .filter((tx) => tx.type === 'expense' && getMonthKey(tx.date) === currentMonth)
    .reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + (Number(tx.amount) || 0);
      return acc;
    }, {});

  return Object.entries(totals)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);
};

const getOverspentBudgets = (transactions = [], budgets = []) => {
  const currentMonth = monthKeyOffset(0);
  const spending = transactions
    .filter((tx) => tx.type === 'expense' && getMonthKey(tx.date) === currentMonth)
    .reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + (Number(tx.amount) || 0);
      return acc;
    }, {});

  return budgets
    .map((budget) => ({
      category: budget.category,
      budget: Number(budget.amount) || 0,
      spent: spending[budget.category] || 0,
      overBy: Math.max(0, (spending[budget.category] || 0) - (Number(budget.amount) || 0)),
    }))
    .filter((budget) => budget.overBy > 0)
    .sort((a, b) => b.overBy - a.overBy);
};

export const generateFinancialReport = (summary = {}, state = {}) => {
  const transactions = Array.isArray(state.transactions) ? state.transactions : [];
  const budgets = Array.isArray(state.budgets) ? state.budgets : [];
  const profile = { ...DEFAULT_PROFILE, ...(state.userProfile || {}) };
  const metrics = summary.metrics || {};
  const stage = summary.stage || { id: 0, name: 'Survival' };
  const priorities = Array.isArray(summary.priorities) ? summary.priorities : [];
  const nextActions = Array.isArray(summary.nextActions) ? summary.nextActions : [];
  const criticalItems = priorities.filter((item) => item.status === 'critical');
  const warningItems = priorities.filter((item) => item.status === 'attention');
  const emergencyGap = Math.max(0, (Number(metrics.emergencyTarget) || 0) - (Number(metrics.emergencySaved) || 0));
  const protectionWeak = Boolean(metrics.protectionWeak);
  const topExpenses = getTopExpenseCategories(transactions);
  const overspentBudgets = getOverspentBudgets(transactions, budgets);
  const savingsRate = Number(metrics.savingsRate) || 0;
  const surplus = Number(metrics.surplus) || 0;
  const score = Math.round(Number(summary.score) || 0);

  const topExpenseText = topExpenses.length
    ? topExpenses.map((item) => `${item.category} (${currency(item.amount)})`).join(', ')
    : 'no major spending categories are visible yet';
  const overspendingText = overspentBudgets.length
    ? `${overspentBudgets[0].category} is over budget by ${currency(overspentBudgets[0].overBy)}`
    : budgets.length ? 'your tracked budgets are mostly within limits' : 'you do not have enough budget limits set yet';

  const overview = score >= 75
    ? `You are currently in Stage ${stage.id}: ${stage.name}, with a financial health score of ${score}/100. Your finances look broadly stable, which means the focus can shift from fixing basics to improving consistency, planning, and long-term growth.`
    : score >= 50
      ? `You are currently in Stage ${stage.id}: ${stage.name}, with a financial health score of ${score}/100. You have some useful habits in place, but your plan is not fully steady yet, so the next few decisions should focus on strengthening the basics before taking on bigger goals.`
      : `You are currently in Stage ${stage.id}: ${stage.name}, with a financial health score of ${score}/100. Right now, your finances need foundation work first; earning and spending activity exists, but the protection layer is not strong enough to absorb surprises comfortably.`;

  const foundationAnalysis = (() => {
    const emergencySentence = emergencyGap > 0
      ? `Your emergency fund has ${currency(metrics.emergencySaved)} saved against a target of ${currency(metrics.emergencyTarget)}, leaving a gap of ${currency(emergencyGap)}. This matters because a job loss, medical bill, or urgent family expense can force you into debt if there is no cash cushion.`
      : `Your emergency fund target of ${currency(metrics.emergencyTarget)} is covered, which gives your plan a real safety buffer. This makes every other financial decision less fragile because unexpected expenses are less likely to derail your budget.`;

    const insuranceGaps = [];
    if (!profile.hasHealthInsurance) insuranceGaps.push('health insurance');
    if (Number(profile.dependents) > 0 && !profile.hasTermInsurance) insuranceGaps.push('term insurance');

    const insuranceSentence = insuranceGaps.length
      ? `You should also address ${insuranceGaps.join(' and ')}. Insurance is not about returns; it protects your savings and your family from one large event wiping out years of progress.`
      : Number(profile.dependents) > 0
        ? `Your insurance inputs do not show a major protection gap for a household with dependents. Keep these covers active, because dependents make income protection more important.`
        : `Your insurance inputs do not show a major protection gap, and term insurance is not treated as mandatory because no dependents are listed.`;

    return `${emergencySentence} ${insuranceSentence}`;
  })();

  const spendingAnalysis = `This month, income is ${currency(metrics.income)} and expenses are ${currency(metrics.expenses)}, leaving a surplus of ${signedCurrency(surplus)} and a savings rate of ${savingsRate.toFixed(1)}%. The largest visible spending areas are ${topExpenseText}, and ${overspendingText}.`;

  const riskAnalysis = (() => {
    if (protectionWeak) {
      return `The biggest risk is that your financial plan can be disrupted by one unexpected event. If this continues, investing too early could create a false sense of progress while the real safety gaps remain open, so new growth commitments should wait until the emergency fund and insurance basics are stronger.`;
    }

    if (surplus <= 0 || savingsRate < 20 || warningItems.length > 0) {
      return `The main risk now is slow progress rather than immediate danger. If savings stay below the 20% target or overspending keeps repeating, long-term goals may feel active on paper but remain underfunded in real life.`;
    }

    return `Your current risk level looks controlled. The main danger is complacency: once the basics are strong, the next challenge is making sure surplus money is consistently directed toward investments, retirement, and larger goals instead of being absorbed by lifestyle spending.`;
  })();

  const actionPlan = (() => {
    const actions = nextActions.slice(0, 5);
    if (!actions.length) {
      return 'Your immediate plan is maintenance: keep tracking spending, review insurance once a quarter, and keep surplus money assigned to long-term goals before it gets spent casually.';
    }

    return actions
      .map((action, index) => {
        const prefix = `Step ${index + 1}: ${action.description}`;
        if (index === 0 && emergencyGap > 0 && action.title.toLowerCase().includes('emergency')) {
          return `${prefix} This should come first because the emergency fund is the cushion that protects every other part of your plan.`;
        }
        if (action.title.toLowerCase().includes('investment')) {
          return `${prefix} Treat this as a guardrail, because growth decisions work best only after the foundation is safe.`;
        }
        return `${prefix} This will improve your financial position without adding complexity.`;
      })
      .join(' ');
  })();

  return {
    overview,
    foundationAnalysis,
    spendingAnalysis,
    riskAnalysis,
    actionPlan: criticalItems.length
      ? `${actionPlan} Because there are ${criticalItems.length} critical gaps, handle those before optimizing lower-priority areas.`
      : actionPlan,
  };
};
