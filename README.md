# FinFlow — Personal Finance Planner

FinFlow is a feature-rich, visually premium personal finance management web application built with React and Vite. It helps users track income, expenses, budgets, and savings goals while gaining insights through interactive data visualizations.

## 🚀 Features

- **Dashboard**: High-level overview of net balance, monthly income/expenses, savings rate, and recent transactions.
- **Transactions Management**: Add, edit, delete, search, and filter transactions by date, type, and category.
- **Budgets**: Set monthly limits per category and track your spending against them with progress bars.
- **Savings Goals**: Create visual goals with target amounts, icons, and deadlines. Add contributions and track progress.
- **Advanced Analytics**: Interactive charts using ApexCharts including:
  - Income vs Expenses grouped bar chart
  - Monthly Savings Rate trend line
  - Net Worth over time line chart
  - Expense Distribution treemap
- **Settings**: Manage profile details, view data insights, export transactions to CSV, and reset/clear data.
- **Local Storage Persistence**: All data is securely stored locally in your browser using Zustand's persist middleware.
- **Dark Mode Design System**: A sleek, custom CSS design system featuring glassmorphism, smooth animations, and a responsive layout.

## 🛠️ Technology Stack

- **Framework**: React 18 + Vite
- **State Management**: Zustand (+ `zustand/middleware` for localStorage persistence)
- **Routing**: React Router v6
- **Charts**: ApexCharts (`react-apexcharts`)
- **Icons**: Lucide React
- **Styling**: Vanilla CSS with custom properties and a utility-first approach
- **Fonts**: Google Fonts (Inter)

## 📁 Project Structure

```
src/
├── assets/             # Static assets
├── components/         # Reusable React components
│   ├── layout/         # Sidebar, TopBar, etc.
│   ├── modals/         # Global modals (e.g., TransactionModal)
│   └── ui/             # Primitive UI components (StatCard, Buttons, etc.)
├── context/            # (Legacy) Replaced by Zustand
├── data/               # Seed data for demonstration
├── pages/              # Main route components (Dashboard, Analytics, etc.)
├── store/              # Zustand stores (useFinanceStore, useUIStore)
├── utils/              # Helper functions (formatters, categories logic)
├── App.jsx             # Main application shell and routing
├── index.css           # Global design system tokens and styles
└── main.jsx            # Entry point
```

## 💻 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

### Installation

1. Navigate to the your project directory:

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173/`

### Building for Production

To build the app for production:

```bash
npm run build
```

This will generate an optimized build in the `dist` folder.

## 🎨 Design System

The app utilizes a custom design system defined in `src/index.css`. It heavily relies on CSS variables for consistent theming. Key features include:

- **Tokens**: Standardized spacing, typography, and color variables.
- **Glassmorphism**: Achieved using `rgba` backgrounds, borders, and `backdrop-filter: blur()`.
- **Gradients**: Vibrant accent gradients using `--gradient` and `--gradient-full`.

## 🤝 Contributing

This project uses a simple state model and standard React component patterns, making it easy to extend. To add a new feature:
1. Create new UI components in `src/components/ui`.
2. Add necessary state and actions to `useFinanceStore.js`.
3. If introducing ephemeral UI state (e.g., a new modal), update `useUIStore.js`.
4. Register any new routes in `App.jsx`.

---
*Built with ❤️ using React & Vite.*
