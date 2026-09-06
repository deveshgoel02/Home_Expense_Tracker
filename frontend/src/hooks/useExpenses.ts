import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { expensesApi, type ExpenseFilters, type ExpenseInput } from "../lib/api";

export function useExpenses(filters: ExpenseFilters) {
  return useQuery({
    queryKey: ["expenses", filters],
    queryFn: () => expensesApi.list(filters),
    placeholderData: (prev) => prev,
  });
}

function useInvalidateExpenseRelated() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["expenses"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["reports"] });
  };
}

export function useCreateExpense() {
  const invalidate = useInvalidateExpenseRelated();
  return useMutation({
    mutationFn: (data: ExpenseInput) => expensesApi.create(data),
    onSuccess: invalidate,
  });
}

export function useUpdateExpense() {
  const invalidate = useInvalidateExpenseRelated();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExpenseInput> }) => expensesApi.update(id, data),
    onSuccess: invalidate,
  });
}

export function useDeleteExpense() {
  const invalidate = useInvalidateExpenseRelated();
  return useMutation({
    mutationFn: (id: string) => expensesApi.remove(id),
    onSuccess: invalidate,
  });
}

export function useDuplicateExpense() {
  const invalidate = useInvalidateExpenseRelated();
  return useMutation({
    mutationFn: (id: string) => expensesApi.duplicate(id),
    onSuccess: invalidate,
  });
}
