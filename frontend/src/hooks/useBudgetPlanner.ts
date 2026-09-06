import { useMutation, useQueryClient } from "@tanstack/react-query";
import { budgetPlannerApi } from "../lib/api";

export function useGenerateBudgetPlan() {
  return useMutation({ mutationFn: budgetPlannerApi.plan });
}

export function useApplyBudgetPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: budgetPlannerApi.apply,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
