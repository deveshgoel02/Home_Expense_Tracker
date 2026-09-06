import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { NAV_ITEMS } from "./navItems";
import { Plus } from "../ui/icons";
import { useAddExpenseModal } from "../../context/AddExpenseModalContext";

const MOBILE_ITEMS = NAV_ITEMS.filter((i) => ["/", "/expenses", "/income", "/reports"].includes(i.to));

export function MobileNav() {
  const { open } = useAddExpenseModal();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-900/95">
      {MOBILE_ITEMS.slice(0, 2).map((item) => (
        <MobileLink key={item.to} item={item} />
      ))}

      <button
        onClick={() => open()}
        className="flex h-12 w-12 -translate-y-3 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-200"
        aria-label="Add expense"
      >
        <Plus className="h-6 w-6" />
      </button>

      {MOBILE_ITEMS.slice(2).map((item) => (
        <MobileLink key={item.to} item={item} />
      ))}
    </nav>
  );
}

function MobileLink({ item }: { item: (typeof NAV_ITEMS)[number] }) {
  return (
    <NavLink
      to={item.to}
      end={"end" in item ? item.end : false}
      className={({ isActive }) =>
        clsx(
          "flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-medium",
          isActive ? "text-brand-600 dark:text-brand-400" : "text-slate-400 dark:text-slate-500"
        )
      }
    >
      <item.icon className="h-5 w-5" />
      {item.label}
    </NavLink>
  );
}
