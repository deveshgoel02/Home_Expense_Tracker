import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useUsers, useUpdateUser } from "../hooks/useUsers";
import { useDashboard } from "../hooks/useDashboard";
import { useCurrentUser } from "../context/CurrentUserContext";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { ChevronRight } from "../components/ui/icons";
import { formatPaise } from "../lib/format";

export default function Family() {
  const now = new Date();
  const [month] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());
  const { data: users = [], isLoading } = useUsers(true);
  const { data: dashboard } = useDashboard(month, year);
  const updateUser = useUpdateUser();
  const { currentUser } = useCurrentUser();

  const spendByUser = new Map(dashboard?.userBreakdown.map((b) => [b.key, b.amountPaise]) ?? []);

  async function toggleActive(id: string, isActive: boolean) {
    try {
      await updateUser.mutateAsync({ id, data: { isActive: !isActive } });
      toast.success(!isActive ? "Member activated" : "Member deactivated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update member");
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Family</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Household members and their individual spending this month.</p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card key={user.id} className="flex items-center justify-between gap-3">
            <Link to={`/family/${user.id}`} className="flex min-w-0 flex-1 items-center gap-3">
              <div
                className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: user.color }}
              >
                {user.initials}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{user.name}</p>
                  {!user.isActive && <Badge tone="slate">Inactive</Badge>}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{formatPaise(spendByUser.get(user.id) ?? 0)} this month</p>
              </div>
            </Link>
            <div className="flex flex-shrink-0 items-center gap-2">
              {currentUser?.id !== user.id && (
                <button
                  onClick={() => toggleActive(user.id, user.isActive)}
                  className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                >
                  {user.isActive ? "Deactivate" : "Activate"}
                </button>
              )}
              <Link
                to={`/family/${user.id}`}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
