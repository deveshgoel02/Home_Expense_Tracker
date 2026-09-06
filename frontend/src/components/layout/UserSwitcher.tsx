import { useCurrentUser } from "../../context/CurrentUserContext";

export function UserSwitcher() {
  const { currentUser, users, setCurrentUserId } = useCurrentUser();

  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-slate-400">Using as</p>
      <select
        value={currentUser?.id ?? ""}
        onChange={(e) => setCurrentUserId(e.target.value || null)}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 focus:border-brand-500 focus:outline-none"
      >
        <option value="">Select who you are</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>
    </div>
  );
}
