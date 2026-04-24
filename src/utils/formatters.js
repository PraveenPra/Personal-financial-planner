// ─── Currency ─────────────────────────────────────────────────────────────────
export const formatCurrency = (amount, compact = false) => {
  if (amount === null || amount === undefined) return '₹0';
  const num = Number(amount);
  if (compact && Math.abs(num) >= 100000) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(num);
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

// ─── Date ─────────────────────────────────────────────────────────────────────
export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

export const formatDateShort = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short',
  });
};

export const formatMonthYear = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    month: 'long', year: 'numeric',
  });
};

export const getMonthKey = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const getMonthLabel = (monthKey) => {
  const [year, month] = monthKey.split('-');
  return new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
};

// ─── Percent ──────────────────────────────────────────────────────────────────
export const formatPercent = (value, decimals = 1) => {
  return `${Number(value).toFixed(decimals)}%`;
};

// ─── Number ───────────────────────────────────────────────────────────────────
export const formatNumber = (num) =>
  new Intl.NumberFormat('en-IN').format(Math.round(num));

// ─── Days remaining ───────────────────────────────────────────────────────────
export const daysRemaining = (deadline) => {
  const today = new Date();
  const end = new Date(deadline);
  const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
  return diff;
};

// ─── Trend ────────────────────────────────────────────────────────────────────
export const calcTrend = (current, previous) => {
  if (!previous || previous === 0) return { value: 0, dir: 'neutral' };
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  return {
    value: Math.abs(pct).toFixed(1),
    dir: pct > 0 ? 'up' : pct < 0 ? 'down' : 'neutral',
  };
};

// ─── Today's date ISO ─────────────────────────────────────────────────────────
export const todayISO = () => new Date().toISOString().split('T')[0];

// ─── Month range ──────────────────────────────────────────────────────────────
export const getLast6Months = () => {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    months.push(getMonthKey(d));
  }
  return months;
};
