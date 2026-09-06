import { ChartBar, Home, PiggyBank, Receipt, Settings, Sparkles, Users, Wallet } from "../ui/icons";

export const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: Home, end: true },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/income", label: "Income", icon: Wallet },
  { to: "/budgets", label: "Budgets", icon: PiggyBank },
  { to: "/budget-planner", label: "Budget Planner", icon: Sparkles },
  { to: "/family", label: "Family", icon: Users },
  { to: "/reports", label: "Reports", icon: ChartBar },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;
