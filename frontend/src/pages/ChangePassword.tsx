import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { authApi } from "../lib/api";
import { useCurrentUser } from "../context/CurrentUserContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Field";

export default function ChangePassword({ forced = false }: { forced?: boolean }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUser();

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
      queryClient.setQueryData(["auth", "me"], currentUser ? { ...currentUser, mustChangePassword: false } : currentUser);
      toast.success("Password updated");
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <h1 className="mb-1 text-lg font-bold text-slate-900 dark:text-slate-100">
          {forced ? "Set a new password" : "Change your password"}
        </h1>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          {forced
            ? "You're using a temporary password. Please set your own before continuing."
            : "Enter your current password and choose a new one."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save New Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
