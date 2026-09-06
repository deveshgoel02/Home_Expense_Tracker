import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { NAV_ITEMS } from "./navItems";
import { Plus } from "../ui/icons";
import { Button } from "../ui/Button";
import { useAddExpenseModal } from "../../context/AddExpenseModalContext";
import { UserSwitcher } from "./UserSwitcher";

export function Sidebar() {
  const { open } = useAddExpenseModal();

  return (
    <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex items-center gap-2 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white font-bold">₹</div>
        <div>
          <p className="text-sm font-bold leading-tight text-slate-900">Family Expense</p>
          <p className="text-xs leading-tight text-slate-400">Tracker</p>
        </div>
      </div>

      <div className="px-4">
        <Button className="w-full" onClick={() => open()}>
          <Plus className="h-4 w-4" /> Add Expense
        </Button>
      </div>

      <nav className="mt-4 flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={"end" in item ? item.end : false}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <UserSwitcher />
      </div>
    </aside>
  );
}
