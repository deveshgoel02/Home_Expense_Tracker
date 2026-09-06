import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoriesApi } from "../lib/api";

export function useCategories() {
  return useQuery({ queryKey: ["categories"], queryFn: () => categoriesApi.list() });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
