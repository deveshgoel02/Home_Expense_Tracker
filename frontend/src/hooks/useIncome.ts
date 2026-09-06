import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { incomeApi, type IncomeInput } from "../lib/api";

export function useIncome(params: { month?: number; year?: number; userId?: string }) {
  return useQuery({ queryKey: ["income", params], queryFn: () => incomeApi.list(params) });
}

function useInvalidateIncomeRelated() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["income"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["reports"] });
  };
}

export function useCreateIncome() {
  const invalidate = useInvalidateIncomeRelated();
  return useMutation({ mutationFn: (data: IncomeInput) => incomeApi.create(data), onSuccess: invalidate });
}

export function useUpdateIncome() {
  const invalidate = useInvalidateIncomeRelated();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IncomeInput> }) => incomeApi.update(id, data),
    onSuccess: invalidate,
  });
}

export function useDeleteIncome() {
  const invalidate = useInvalidateIncomeRelated();
  return useMutation({ mutationFn: (id: string) => incomeApi.remove(id), onSuccess: invalidate });
}
