import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useCurrentUser } from "../context/CurrentUserContext";

export function RequireAuth() {
  const { currentUser, isLoading } = useCurrentUser();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-sm text-slate-400 dark:text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (currentUser.mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  return <Outlet />;
}
