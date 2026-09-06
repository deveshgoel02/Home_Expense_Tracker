import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useUsers, useUpdateUser } from "../hooks/useUsers";
import { useCategories, useCreateCategory } from "../hooks/useCategories";
import { useSettings, useUpdateSettings } from "../hooks/useSettings";
import { Card, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Field";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { ThemeToggle } from "../components/layout/ThemeToggle";
import { formatPaise } from "../lib/format";

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage family members, categories, and alert thresholds.</p>
      </div>

      <FamilyMembersSection />
      <CategoriesSection />
      <ThresholdsSection />
      <CurrencySection />
    </div>
  );
}

function FamilyMembersSection() {
  const { data: users = [], isLoading } = useUsers(true);
  const updateUser = useUpdateUser();

  async function toggleActive(id: string, isActive: boolean) {
    try {
      await updateUser.mutateAsync({ id, data: { isActive: !isActive } });
      toast.success(!isActive ? "Member activated" : "Member deactivated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update member");
    }
  }

  return (
    <Card>
      <CardHeader
        title="Family Members"
        subtitle="The 6 seeded household members. Deactivate someone who is temporarily not tracked instead of deleting their history."
      />
      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: user.color }}
                >
                  {user.initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user.name}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Added {new Date(user.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!user.isActive && <Badge tone="slate">Inactive</Badge>}
                <Button variant="secondary" size="sm" onClick={() => toggleActive(user.id, user.isActive)}>
                  {user.isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function CategoriesSection() {
  const { data: categories = [], isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const [name, setName] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createCategory.mutateAsync({ name: name.trim() });
      toast.success("Category added");
      setName("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add category");
    }
  }

  return (
    <Card>
      <CardHeader title="Categories" subtitle="Add a custom category if the default list doesn't cover something your family spends on." />
      <form onSubmit={handleAdd} className="mb-4 flex gap-2">
        <Input placeholder="e.g. Pet Care" value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
        <Button type="submit" disabled={createCategory.isPending}>
          Add
        </Button>
      </form>
      {isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : (
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Badge key={c.id} tone={c.isCustom ? "brand" : "slate"}>
              {c.name}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}

function ThresholdsSection() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  const [warning, setWarning] = useState(70);
  const [critical, setCritical] = useState(100);
  const [creditCardWarning, setCreditCardWarning] = useState(40000);
  const [budgetWarning, setBudgetWarning] = useState(80);
  const [budgetCritical, setBudgetCritical] = useState(100);

  useEffect(() => {
    if (settings) {
      setWarning(settings.warningThresholdPercent);
      setCritical(settings.criticalThresholdPercent);
      setCreditCardWarning(settings.creditCardWarningPaise / 100);
      setBudgetWarning(settings.budgetWarningPercent);
      setBudgetCritical(settings.budgetCriticalPercent);
    }
  }, [settings]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateSettings.mutateAsync({
        warningThresholdPercent: warning,
        criticalThresholdPercent: critical,
        creditCardWarningPaise: Math.round(creditCardWarning * 100),
        budgetWarningPercent: budgetWarning,
        budgetCriticalPercent: budgetCritical,
      });
      toast.success("Alert thresholds updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update settings");
    }
  }

  if (isLoading) {
    return (
      <Card>
        <Skeleton className="h-32 w-full" />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Financial Alert Thresholds" subtitle="Control when the dashboard warns you about spending." />
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Warning threshold (% of income spent)"
            type="number"
            min={1}
            max={100}
            value={warning}
            onChange={(e) => setWarning(Number(e.target.value))}
          />
          <Input
            label="Critical threshold (% of income spent)"
            type="number"
            min={1}
            max={200}
            value={critical}
            onChange={(e) => setCritical(Number(e.target.value))}
          />
          <Input
            label="Credit card warning amount (₹)"
            type="number"
            min={0}
            value={creditCardWarning}
            onChange={(e) => setCreditCardWarning(Number(e.target.value))}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Budget warning (% of budget used)"
            type="number"
            min={1}
            max={100}
            value={budgetWarning}
            onChange={(e) => setBudgetWarning(Number(e.target.value))}
          />
          <Input
            label="Budget critical (% of budget used)"
            type="number"
            min={1}
            max={200}
            value={budgetCritical}
            onChange={(e) => setBudgetCritical(Number(e.target.value))}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={updateSettings.isPending}>
            {updateSettings.isPending ? "Saving..." : "Save Thresholds"}
          </Button>
        </div>
      </form>
      {settings && (
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
          Current credit card warning: {formatPaise(settings.creditCardWarningPaise)}
        </p>
      )}
    </Card>
  );
}

function CurrencySection() {
  return (
    <Card>
      <CardHeader title="Currency & Preferences" />
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Currency</span>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Indian Rupee (₹ INR)</span>
        </div>
        <ThemeToggle className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700" />
      </div>
      <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
        This application is built specifically for the family's use in India and always formats amounts using Indian number
        grouping (e.g. ₹1,25,000).
      </p>
    </Card>
  );
}
