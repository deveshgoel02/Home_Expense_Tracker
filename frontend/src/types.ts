export type PaymentMethod = "CASH" | "DEBIT_CARD" | "CREDIT_CARD" | "BANK_TRANSFER" | "UPI" | "OTHER";

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "DEBIT_CARD", label: "Debit Card" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "UPI", label: "UPI" },
  { value: "OTHER", label: "Other" },
];

export interface User {
  id: string;
  name: string;
  initials: string;
  color: string;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  isCustom: boolean;
}

export interface Expense {
  id: string;
  amountPaise: number;
  date: string;
  userId: string;
  categoryId: string;
  subcategory: string | null;
  description: string;
  paymentMethod: PaymentMethod;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  user: User;
  category: Category;
}

export interface Income {
  id: string;
  month: number;
  year: number;
  amountPaise: number;
  source: string;
  userId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  user: User | null;
}

export interface Budget {
  id: string;
  categoryId: string;
  month: number;
  year: number;
  amountPaise: number;
  category: Category;
}

export interface Paginated<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface MonthlySummary {
  totalIncomePaise: number;
  totalExpensePaise: number;
  creditCardPaise: number;
  nonCreditPaise: number;
  remainingPaise: number;
  savingsPaise: number;
  savingsRatePercent: number;
  expenseRatioPercent: number;
  creditCardDependencePercent: number;
  transactionCount: number;
}

export interface BreakdownItem {
  key: string;
  label: string;
  amountPaise: number;
  percentOfTotal: number;
  transactionCount: number;
}

export interface DailyPoint {
  date: string;
  amountPaise: number;
}

export type AlertSeverity = "info" | "warning" | "critical";

export interface Alert {
  severity: AlertSeverity;
  message: string;
}

export interface BudgetStatus {
  categoryId: string;
  categoryLabel: string;
  budgetPaise: number;
  actualPaise: number;
  remainingPaise: number;
  percentUsed: number;
  severity: AlertSeverity;
}

export interface MonthComparison {
  current: MonthlySummary;
  previous: MonthlySummary;
  incomeChangePaise: number;
  incomeChangePercent: number;
  expenseChangePaise: number;
  expenseChangePercent: number;
  savingsChangePaise: number;
  creditCardChangePaise: number;
  creditCardChangePercent: number;
}

export interface Dashboard {
  month: number;
  year: number;
  summary: MonthlySummary;
  categoryBreakdown: BreakdownItem[];
  userBreakdown: BreakdownItem[];
  paymentMethodBreakdown: BreakdownItem[];
  daily: DailyPoint[];
  alerts: Alert[];
  insights: string[];
  recentTransactions: Expense[];
  budgetStatus: BudgetStatus[];
  comparison: MonthComparison;
}

export interface MonthlyReport {
  month: number;
  year: number;
  summary: MonthlySummary;
  categoryBreakdown: BreakdownItem[];
  userBreakdown: BreakdownItem[];
  paymentMethodBreakdown: BreakdownItem[];
  daily: DailyPoint[];
  comparison: MonthComparison;
  topExpenses: Expense[];
}

export interface MemberReport {
  user: User;
  month: number;
  year: number;
  monthlySpendingPaise: number;
  weekSpendingPaise: number;
  todaySpendingPaise: number;
  transactionCount: number;
  creditCardPaise: number;
  cashPaise: number;
  previousMonthSpendingPaise: number;
  changeFromPreviousMonthPercent: number;
  topCategories: BreakdownItem[];
  daily: DailyPoint[];
}

export interface Settings {
  id: string;
  warningThresholdPercent: number;
  criticalThresholdPercent: number;
  creditCardWarningPaise: number;
  budgetWarningPercent: number;
  budgetCriticalPercent: number;
}
