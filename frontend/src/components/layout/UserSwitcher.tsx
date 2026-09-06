import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useCurrentUser } from "../../context/CurrentUserContext";
import { LogOut } from "../ui/icons";

export function UserSwitcher() {
  const { currentUser, logout } = useCurrentUser();
  const navigate = useNavigate();

  if (!currentUser) return null;

  async function handleLogout() {
    await logout();
    toast.success("Signed out");
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
      <div
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
        style={{ backgroundColor: currentUser.color }}
      >
        {currentUser.initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{currentUser.name}</p>
      </div>
      <button
        onClick={handleLogout}
        className="flex-shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
