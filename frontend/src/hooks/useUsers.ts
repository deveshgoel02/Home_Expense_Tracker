import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "../lib/api";
import type { User } from "../types";

export function useUsers(includeInactive = false) {
  return useQuery({ queryKey: ["users", includeInactive], queryFn: () => usersApi.list(includeInactive) });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Pick<User, "name" | "color" | "isActive">> }) =>
      usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; color?: string }) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "members"] });
    },
  });
}
