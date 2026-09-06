import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useUsers, useUpdateUser, useCreateUser } from "../hooks/useUsers";
import { useCategories, useCreateCategory } from "../hooks/useCategories";
import { useSettings, useUpdateSettings } from "../hooks/useSettings";
import { useCurrentUser } from "../context/CurrentUserContext";
import { authApi } from "../lib/api";
import { Card, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Field";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { Modal } from "../components/ui/Modal";
import { ThemeToggle } from "../components/layout/ThemeToggle";
import { Plus, Copy } from "../components/ui/icons";
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
      <SecuritySection />
      <CurrencySection />
    </div>
  );
}

function FamilyMembersSection() {
  const { data: users = [], isLoading } = useUsers(true);
  const updateUser = useUpdateUser();
  const createUser = useCreateUser();
  const { currentUser } = useCurrentUser();

  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [addError, setAddError] = useState("");
  const [newCredential, setNewCredential] = useState<{ name: string; password: string } | null>(null);

  async function toggleActive(id: string, isActive: boolean) {
    try {
      await updateUser.mutateAsync({ id, data: { isActive: !isActive } });
      toast.success(!isActive ? "Member activated" : "Member deactivated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update member");
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    if (!newName.trim()) {
      setAddError("Please enter a name.");
      return;
    }
    try {
      const result = await createUser.mutateAsync({ name: newName.trim() });
      setAddOpen(false);
      setNewName("");
      if (result.temporaryPassword) {
        setNewCredential({ name: result.user.name, password: result.temporaryPassword });
      }
      toast.success(`${result.user.name} added`);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to add member");
    }
  }

  function copyCredential() {
    if (!newCredential) return;
    navigator.clipboard
      .writeText(`Name: ${newCredential.name}\nTemporary password: ${newCredential.password}`)
      .then(() => toast.success("Copied to clipboard"))
      .catch(() => toast.error("Couldn't copy — please copy it manually"));
  }

  return (
    <Card>
      <CardHeader
        title="Family Members"
        subtitle="Manage who can sign in and track expenses. Deactivate someone instead of deleting their history."
        action={
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> Add Member
          </Button>
        }
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
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {user.name}
                    {currentUser?.id === user.id && <span className="ml-1.5 text-xs font-normal text-slate-400 dark:text-slate-500">(you)</span>}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Added {new Date(user.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!user.isActive && <Badge tone="slate">Inactive</Badge>}
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentUser?.id === user.id}
                  onClick={() => toggleActive(user.id, user.isActive)}
                >
                  {user.isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Family Member" maxWidth="max-w-sm">
        <form onSubmit={handleAddMember} className="space-y-4">
          <Input
            label="Name"
            required
            placeholder="e.g. Priya"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            error={addError}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            A secure temporary password will be generated. You'll see it once — share it with them and ask them to change
            it after signing in.
          </p>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createUser.isPending}>
              {createUser.isPending ? "Adding..." : "Add Member"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(newCredential)} onClose={() => setNewCredential(null)} title="Member Added" maxWidth="max-w-sm">
        {newCredential && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Save this temporary password now — for security, it will not be shown again.
            </p>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{newCredential.name}</p>
              <p className="mt-1 font-mono text-lg font-semibold text-slate-900 dark:text-slate-100">{newCredential.password}</p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={copyCredential}>
                <Copy className="h-4 w-4" /> Copy
              </Button>
              <Button onClick={() => setNewCredential(null)}>Done</Button>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
}

function SecuritySection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    setIsSubmitting(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Security" subtitle="Change your own password." />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="Current password"
            type="password"
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            label="New password"
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            label="Confirm new password"
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Update Password"}
          </Button>
        </div>
      </form>
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
