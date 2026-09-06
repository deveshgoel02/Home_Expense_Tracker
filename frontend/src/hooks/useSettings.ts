import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "../lib/api";
import type { Settings } from "../types";

export function useSettings() {
  return useQuery({ queryKey: ["settings"], queryFn: () => settingsApi.get() });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Settings>) => settingsApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
