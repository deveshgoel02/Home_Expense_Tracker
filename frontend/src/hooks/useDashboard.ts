import { useQuery } from "@tanstack/react-query";
import { dashboardApi, reportsApi } from "../lib/api";

export function useDashboard(month: number, year: number) {
  return useQuery({ queryKey: ["dashboard", month, year], queryFn: () => dashboardApi.get(month, year) });
}

export function useMonthlyReport(month: number, year: number) {
  return useQuery({ queryKey: ["reports", "monthly", month, year], queryFn: () => reportsApi.monthly(month, year) });
}

export function useMemberReport(userId: string | null, month: number, year: number) {
  return useQuery({
    queryKey: ["reports", "member", userId, month, year],
    queryFn: () => reportsApi.member(userId as string, month, year),
    enabled: Boolean(userId),
  });
}
