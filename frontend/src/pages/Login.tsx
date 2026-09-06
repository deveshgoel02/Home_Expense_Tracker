import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authApi } from "../lib/api";
import { useCurrentUser } from "../context/CurrentUserContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Field";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useCurrentUser();
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ["auth", "members"],
    queryFn: () => authApi.members(),
  });

  const [selectedId, setSelectedId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedMember = members.find((m) => m.id === selectedId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!selectedMember) {
      setError("Please select who you are.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await login(selectedMember.name, password);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}!`);
      navigate(user.mustChangePassword ? "/change-password" : "/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-xl font-bold text-white">₹</div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Family Expense Tracker</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Sign in to see your family's finances.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Who are you?</label>
            <div className="grid grid-cols-3 gap-2">
              {membersLoading && (
                <p className="col-span-3 text-sm text-slate-400 dark:text-slate-500">Loading family members...</p>
              )}
              {!membersLoading && members.length === 0 && (
                <p className="col-span-3 text-sm text-slate-400 dark:text-slate-500">
                  No family members are set up yet. Ask whoever manages this app to add one.
                </p>
              )}
              {members.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-colors ${
                    selectedId === m.id
                      ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                    style={{ backgroundColor: m.color }}
                  >
                    {m.initials}
                  </span>
                  <span className="truncate">{m.name}</span>
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
