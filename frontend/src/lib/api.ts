import axios from "axios";
import type {
  Budget,
  Category,
  Dashboard,
  Expense,
  Income,
  MemberReport,
  MonthlyReport,
  Paginated,
  PaymentMethod,
  Settings,
  User,
} from "../types";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message = error.response?.data?.error ?? error.message ?? "Something went wrong";
    return Promise.reject(new Error(message));
  }
);

export interface ExpenseFilters {
  userId?: string;
  categoryId?: string;
  paymentMethod?: PaymentMethod;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  sort?: "newest" | "oldest" | "highest" | "lowest";
  page?: number;
  pageSize?: number;
}

export interface ExpenseInput {
  amount: number;
  date: string;
  userId: string;
  categoryId: string;
  subcategory?: string | null;
  description: string;
  paymentMethod: PaymentMethod;
  notes?: string | null;
}

export interface IncomeInput {
  month: number;
  year: number;
  amount: number;
  source: string;
  userId?: string | null;
  notes?: string | null;
}

export interface BudgetInput {
  categoryId: string;
  month: number;
  year: number;
  amount: number;
}

export const usersApi = {
  list: (includeInactive = false) =>
    api.get<User[]>("/users", { params: { includeInactive } }).then((r) => r.data),
  update: (id: string, data: Partial<Pick<User, "name" | "color" | "isActive">>) =>
    api.patch<User>(`/users/${id}`, data).then((r) => r.data),
};

export const categoriesApi = {
  list: () => api.get<Category[]>("/categories").then((r) => r.data),
  create: (data: { name: string; icon?: string }) => api.post<Category>("/categories", data).then((r) => r.data),
};

export const expensesApi = {
  list: (filters: ExpenseFilters) => api.get<Paginated<Expense>>("/expenses", { params: filters }).then((r) => r.data),
  create: (data: ExpenseInput) => api.post<Expense>("/expenses", data).then((r) => r.data),
  update: (id: string, data: Partial<ExpenseInput>) => api.put<Expense>(`/expenses/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/expenses/${id}`),
  duplicate: (id: string) => api.post<Expense>(`/expenses/${id}/duplicate`).then((r) => r.data),
  exportCsvUrl: (filters: ExpenseFilters) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== "") params.set(k, String(v));
    });
    const base = (import.meta.env.VITE_API_URL ?? "/api") as string;
    return `${base}/expenses/export/csv?${params.toString()}`;
  },
};

export const incomeApi = {
  list: (params: { month?: number; year?: number; userId?: string }) =>
    api.get<Income[]>("/income", { params }).then((r) => r.data),
  create: (data: IncomeInput) => api.post<Income>("/income", data).then((r) => r.data),
  update: (id: string, data: Partial<IncomeInput>) => api.put<Income>(`/income/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/income/${id}`),
};

export const budgetsApi = {
  list: (params: { month: number; year: number }) => api.get<Budget[]>("/budgets", { params }).then((r) => r.data),
  create: (data: BudgetInput) => api.post<Budget>("/budgets", data).then((r) => r.data),
  update: (id: string, amount: number) => api.put<Budget>(`/budgets/${id}`, { amount }).then((r) => r.data),
  remove: (id: string) => api.delete(`/budgets/${id}`),
};

export const dashboardApi = {
  get: (month: number, year: number) => api.get<Dashboard>("/dashboard", { params: { month, year } }).then((r) => r.data),
};

export const reportsApi = {
  monthly: (month: number, year: number) =>
    api.get<MonthlyReport>("/reports/monthly", { params: { month, year } }).then((r) => r.data),
  member: (id: string, month: number, year: number) =>
    api.get<MemberReport>(`/reports/member/${id}`, { params: { month, year } }).then((r) => r.data),
};

export const settingsApi = {
  get: () => api.get<Settings>("/settings").then((r) => r.data),
  update: (data: Partial<Settings>) => api.put<Settings>("/settings", data).then((r) => r.data),
};
