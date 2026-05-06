# FinFlow — Feature Inventory & Roadmap

> A comprehensive breakdown of what FinFlow currently does and what it would take to become a production-grade personal finance manager.

---

## ✅ Current Features

### 1. Dashboard
- At-a-glance **stat cards** for net balance, monthly income, monthly expenses, and savings rate
- Month-over-month **trend indicators** (% change vs last month)
- **Income vs Expenses** area chart (last 6 months) via ApexCharts
- **Expense breakdown** donut chart by category (current month)
- **Budget overview** with top-5 budget progress bars
- **Recent transactions** quick list (latest 6)

### 2. Transaction Management
- Add, edit, and delete individual transactions
- Each transaction stores: type (income/expense), amount, category, date, and note
- **Search** transactions by note or category name
- **Filter** by type, category, and date range
- Summary bar showing filtered totals (income, expense, net)
- Sortable, scrollable data table with inline edit/delete actions
- Confirm-before-delete safety UX

### 3. PDF Statement Import
- Upload PhonePe / UPI statement PDFs with selectable text
- Client-side PDF text extraction using `pdfjs-dist`
- Regex-based statement parser that detects date, type (DEBIT/CREDIT), amount, and description
- **Keyword-based category inference** engine (maps merchant text → categories)
- **Duplicate detection** using fingerprinting (date + type + amount + note)
- Preview table with per-row category override before import
- Bulk import selected rows into the store

### 4. Budgets
- Set monthly spending limits per expense category
- **Budget vs Actual** grouped bar chart
- Per-category progress cards with color-coded status (green/amber/red at 75%/100% thresholds)
- Remaining/over-budget amount display
- Summary strip: total budgeted, total spent, remaining, # over-budget
- Delete individual budgets

### 5. Savings Goals
- Create goals with: name, target amount, deadline, icon (11 emoji options), and color (8 options)
- **Circular progress** SVG visualization per goal
- Days-remaining / overdue indicator
- Contribute money toward a goal (capped at target)
- Edit goal details (name, target, deadline, icon, color)
- Summary strip: total targeted, total saved, remaining, completed count

### 6. Analytics
- **KPI strip**: lifetime income, lifetime expenses, net worth, avg monthly savings, avg savings rate
- **Monthly Income vs Expenses vs Savings** grouped bar chart
- **Monthly Savings Rate** area chart with 20% ideal-line annotation
- **Net Worth Over Time** line chart with zoom/pan
- **Expense Distribution** treemap (all-time, by category)

### 7. Settings & Data
- Edit display name
- **Export to CSV** (all transactions, date-sorted)
- Data overview: total transactions, this-month count, total income/expense
- **Reset to demo data** (restores seed transactions, budgets, goals)
- **Clear all data** (wipes everything)
- Confirm-before-destructive-action safety UX

### 8. UI / UX & Design System
- Custom dark-mode CSS design system with CSS variables (tokens for spacing, colors, radii, typography)
- **Glassmorphism** cards with `backdrop-filter: blur()`
- Gradient accents and glow effects
- Smooth page-enter animations (`animate-in` keyframes)
- Responsive grid layouts (`grid-2`, `grid-4`, `grid-auto`)
- Collapsible sidebar with balance display and user greeting
- Fixed top bar with current page title, date, and quick-add button
- Lucide React icons throughout
- Inter font via Google Fonts

### 9. Architecture & Data Layer
- **Zustand** state management with `persist` middleware → localStorage
- Two stores: `useFinanceStore` (financial data + selectors) and `useUIStore` (sidebar, modals, filters)
- React Router v6 with 6 routes
- Global modals rendered at App root (TransactionModal, StatementImportModal)
- Reusable UI primitives: Modal, StatCard, ProgressBar, CircularProgress
- Vite-based build with fast HMR

---

## 🚀 Features to Add for a Real Financial Planner

### Tier 1 — High Impact, Should-Have

| Feature | Description | Complexity |
|---------|-------------|------------|
| **Recurring Transactions** | Auto-create rent, salary, SIP, subscriptions, EMIs on a schedule (daily/weekly/monthly/yearly). Mark transactions as recurring with start/end dates. | Medium |
| **Multiple Accounts / Wallets** | Support cash, bank, UPI, credit card as separate accounts. Per-account balance tracking. Transfer between accounts. | High |
| **Budget Alerts & Notifications** | Browser notifications or in-app toasts when spending crosses 50%, 80%, 100% of a budget. | Low |
| **Budget Carry-Forward** | Rollover unused budget to next month, or carry overspending as a deficit. | Medium |
| **Tags & Custom Categories** | User-defined tags (e.g., `#work`, `#vacation`) and the ability to create/rename/reorder categories. | Medium |
| **Authentication & Cloud Sync** | User login (email/OAuth), store data in a backend (Firebase/Supabase), sync across devices. | High |
| **Mobile Responsive** | Fully responsive layout for phones and tablets. Hamburger menu for sidebar. Touch-friendly interactions. | Medium |
| **Dark / Light Theme Toggle** | A theme switcher that persists preference. Full light-mode token set. | Low |

### Tier 2 — Smart Insights & Intelligence

| Feature | Description | Complexity |
|---------|-------------|------------|
| **Spend Anomaly Detection** | "Dining is 42% above your 3-month average." Compare category spending against rolling averages and flag outliers. | Medium |
| **Cash Flow Forecast** | Predict end-of-month balance based on recurring transactions + current spending velocity. | Medium |
| **Category Trends** | Side-by-side comparison: this month vs last month vs 3-month average per category. | Low |
| **Weekly/Monthly Spending Digest** | Auto-generated summary card: "This week you spent ₹X, mostly on Food. You're on track / over budget." | Medium |
| **Subscription Tracker** | Identify recurring charges from transaction history, show renewal dates and monthly cost. | Medium |
| **Goal Recommendations** | "If you cut food spend by ₹2,000/month, you hit your MacBook goal 3 months earlier." | Medium |
| **Financial Health Score** | A 0–100 score based on savings rate, budget adherence, debt-to-income, emergency fund coverage. | Medium |
| **Smart Nudges** | Context-aware tips: "You already spent ₹1,800 on cabs this week — 90% of your weekly transport budget." | Medium |

### Tier 3 — Import & Automation

| Feature | Description | Complexity |
|---------|-------------|------------|
| **CSV / Excel Import** | Parse bank CSVs and Excel statements (not just UPI PDFs). Column mapper UI. | Medium |
| **OCR for Scanned PDFs** | Use Tesseract.js or a cloud OCR API for image-based / scanned statement PDFs. | High |
| **SMS / Screenshot Import** | Parse bank SMS messages or WhatsApp payment screenshots. | High |
| **Merchant Normalization** | Map `UDUPI GOKULA CAFE`, `Udupi Gokula`, `Gokula Cafe` → one canonical merchant name. | Medium |
| **Rules Engine** | User-defined rules: "If note contains BMTC, set category to Transport automatically." | Medium |
| **Bulk Edit After Import** | Select multiple transactions, batch-change category/type/date. | Low |
| **Undo Import** | One-click rollback for the last imported statement batch. | Low |
| **Split Transactions** | Divide one payment across multiple categories (e.g., ₹5,000 at BigBasket → ₹3,000 Groceries + ₹2,000 Household). | Medium |

### Tier 4 — Personal Finance Depth

| Feature | Description | Complexity |
|---------|-------------|------------|
| **Credit Card Tracking** | Statement date, due date, minimum due, paid/unpaid status, outstanding balance. | Medium |
| **EMI / Loan Tracker** | Principal, interest rate, tenure, due dates, remaining balance, amortization schedule. | High |
| **Net Worth Dashboard** | Track assets (savings, investments, property) and liabilities (loans, credit cards). Net worth over time. | High |
| **Investment Portfolio** | SIP tracker, mutual fund/stock holdings, returns visualization, portfolio allocation pie chart. | High |
| **Tax Tagging** | Mark transactions as tax-deductible, reimbursable, or business expense. Export tax-ready summaries. | Medium |
| **Envelope / Zero-Based Budgeting** | Allocate every rupee of income to a category. Unallocated amount shown prominently. | Medium |
| **Custom Budget Periods** | Weekly, fortnightly, salary-cycle-based budgets instead of calendar-month only. | Medium |
| **Shared / Household Budgets** | Personal vs family vs roommate spending views. Split shared expenses. | High |
| **Category Sub-Groups** | Hierarchical categories: Food → Groceries, Dining Out, Snacks. Roll-up and drill-down. | Medium |

### Tier 5 — Premium & AI Features

| Feature | Description | Complexity |
|---------|-------------|------------|
| **AI Financial Assistant** | Natural language Q&A: "Where did my money go this month?" "How much did I spend on food in March?" | High |
| **Natural Language Entry** | Type "Spent 240 on lunch at Udupi today" and have it parsed into a transaction automatically. | High |
| **Personalized Savings Tips** | ML-based suggestions derived from actual spending behavior and patterns. | High |
| **Receipt Attachments** | Attach photos/scans of receipts to transactions. Store in IndexedDB or cloud. | Medium |
| **PWA & Offline Support** | Service worker for offline access. Home-screen installable. Push notifications for budget alerts. | Medium |
| **Quick-Add Widget** | Floating action button or home-screen widget for instant transaction entry. | Low |
| **Notes with Merchant Memory** | Auto-suggest merchant names and locations from past transactions. | Low |
| **Export / Import Full Backup** | JSON export/import of entire app state (transactions + budgets + goals + settings). | Low |
| **Multi-Currency Support** | Track expenses in different currencies with exchange rate conversion. | Medium |
| **Collaborative Planning** | Share financial plans with a partner/spouse. Separate permissions and views. | High |

---

## 📊 Current Tech Gaps for Production

| Gap | What's Missing | Suggested Solution |
|-----|---------------|-------------------|
| **No backend** | All data lives in localStorage — lost if browser data is cleared | Firebase / Supabase / custom API |
| **No auth** | No user accounts, no multi-device sync | Firebase Auth / Auth.js |
| **No testing** | Zero unit/integration/e2e tests | Vitest + React Testing Library + Playwright |
| **No error boundaries** | App crashes are unhandled | React Error Boundaries + Sentry |
| **No CI/CD** | No automated builds, linting, or deployments | GitHub Actions + Vercel/Netlify |
| **No i18n** | Hardcoded to INR and en-IN locale | react-i18next + configurable currency |
| **No accessibility** | Missing ARIA labels, keyboard navigation gaps | Audit with axe-core, add `aria-*` attributes |
| **No data validation** | Minimal input validation, no schema enforcement | Zod schemas for transaction/budget/goal data |
| **Single-thread PDF** | PDF parsing blocks the main thread | Move to Web Worker |

---

## 🗺️ Suggested Implementation Order

### Phase 1 — Foundation (Week 1–2)
1. Dark/Light theme toggle
2. Full mobile responsiveness
3. Export/Import full backup (JSON)
4. Bulk edit after import
5. Undo import

### Phase 2 — Core Finance (Week 3–4)
6. Recurring transactions
7. Multiple accounts/wallets
8. Budget alerts (in-app toasts)
9. Tags & custom categories
10. Category sub-groups

### Phase 3 — Intelligence (Week 5–6)
11. Category trends (month-over-month comparison)
12. Spend anomaly detection
13. Cash flow forecast
14. Financial health score
15. Weekly spending digest

### Phase 4 — Import & Automation (Week 7–8)
16. CSV/Excel import with column mapping
17. Rules engine for auto-categorization
18. Merchant normalization
19. Split transactions
20. Budget carry-forward

### Phase 5 — Backend & Production (Week 9–12)
21. Backend setup (Supabase/Firebase)
22. Authentication + cloud sync
23. PWA with offline support
24. Unit + integration + e2e tests
25. CI/CD pipeline

### Phase 6 — Premium (Ongoing)
26. AI financial assistant
27. Natural language transaction entry
28. Credit card & EMI tracking
29. Investment portfolio
30. Net worth dashboard

---

*Generated from codebase analysis on 2026-05-07. Based on 25 source files, 3 documents, and the FinFlow knowledge graph (114 nodes, 154 edges, 21 communities).*
