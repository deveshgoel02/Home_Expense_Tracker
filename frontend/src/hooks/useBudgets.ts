import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { budgetsApi, type BudgetInput } from "../lib/api";

export function useBudgets(month: number, year: number) {
  return useQuery({ queryKey: ["budgets", month, year], queryFn: () => budgetsApi.list({ month, year }) });
}

function useInvalidateBudgetRelated() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["budgets"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };
}

export function useCreateBudget() {
  const invalidate = useInvalidateBudgetRelated();
  return useMutation({ mutationFn: (data: BudgetInput) => budgetsApi.create(data), onSuccess: invalidate });
}

export function useUpdateBudget() {
  const invalidate = useInvalidateBudgetRelated();
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) => budgetsApi.update(id, amount),
    onSuccess: invalidate,
  });
}

export function useDeleteBudget() {
  const invalidate = useInvalidateBudgetRelated();
  return useMutation({ mutationFn: (id: string) => budgetsApi.remove(id), onSuccess: invalidate });
}
