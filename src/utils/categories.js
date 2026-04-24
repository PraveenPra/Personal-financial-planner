// Category definitions with colors, icons (emoji fallback), and types
export const CATEGORIES = [
  // Expense categories
  { id: 'food',          label: 'Food & Dining',      icon: '🍽️',  color: '#f59e0b', type: 'expense' },
  { id: 'transport',     label: 'Transport',           icon: '🚗',  color: '#3b82f6', type: 'expense' },
  { id: 'rent',          label: 'Rent & Housing',      icon: '🏠',  color: '#8b5cf6', type: 'expense' },
  { id: 'utilities',     label: 'Utilities',           icon: '⚡',  color: '#06b6d4', type: 'expense' },
  { id: 'shopping',      label: 'Shopping',            icon: '🛍️',  color: '#ec4899', type: 'expense' },
  { id: 'health',        label: 'Health & Medical',    icon: '🏥',  color: '#10b981', type: 'expense' },
  { id: 'education',     label: 'Education',           icon: '📚',  color: '#f97316', type: 'expense' },
  { id: 'entertainment', label: 'Entertainment',       icon: '🎬',  color: '#a78bfa', type: 'expense' },
  { id: 'travel',        label: 'Travel',              icon: '✈️',  color: '#14b8a6', type: 'expense' },
  { id: 'insurance',     label: 'Insurance',           icon: '🛡️',  color: '#64748b', type: 'expense' },
  { id: 'investment',    label: 'Investment',          icon: '📈',  color: '#22c55e', type: 'expense' },
  { id: 'other_exp',     label: 'Other',               icon: '📦',  color: '#6b7280', type: 'expense' },

  // Income categories
  { id: 'salary',        label: 'Salary',              icon: '💼',  color: '#10b981', type: 'income' },
  { id: 'freelance',     label: 'Freelance',           icon: '💻',  color: '#3b82f6', type: 'income' },
  { id: 'business',      label: 'Business',            icon: '🏢',  color: '#f59e0b', type: 'income' },
  { id: 'rental',        label: 'Rental Income',       icon: '🏘️',  color: '#8b5cf6', type: 'income' },
  { id: 'dividends',     label: 'Dividends',           icon: '💰',  color: '#06b6d4', type: 'income' },
  { id: 'gift',          label: 'Gift / Bonus',        icon: '🎁',  color: '#ec4899', type: 'income' },
  { id: 'other_inc',     label: 'Other Income',        icon: '💵',  color: '#6b7280', type: 'income' },
];

export const EXPENSE_CATEGORIES = CATEGORIES.filter(c => c.type === 'expense');
export const INCOME_CATEGORIES  = CATEGORIES.filter(c => c.type === 'income');

export const getCategoryById = (id) => CATEGORIES.find(c => c.id === id) || {
  id: 'other_exp', label: 'Other', icon: '📦', color: '#6b7280', type: 'expense'
};

export const GOAL_ICONS = [
  { id: 'house',    icon: '🏠', label: 'Home' },
  { id: 'car',      icon: '🚗', label: 'Car' },
  { id: 'vacation', icon: '✈️', label: 'Vacation' },
  { id: 'edu',      icon: '🎓', label: 'Education' },
  { id: 'wedding',  icon: '💍', label: 'Wedding' },
  { id: 'laptop',   icon: '💻', label: 'Laptop' },
  { id: 'phone',    icon: '📱', label: 'Phone' },
  { id: 'savings',  icon: '💰', label: 'Savings' },
  { id: 'health',   icon: '🏥', label: 'Health' },
  { id: 'retire',   icon: '🌴', label: 'Retirement' },
  { id: 'other',    icon: '⭐', label: 'Other' },
];
