import { useState } from "react";
import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { NAV_ITEMS } from "./navItems";
import { Menu, X } from "../ui/icons";
import { UserSwitcher } from "./UserSwitcher";

export function Topbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">₹</div>
          <p className="text-sm font-bold text-slate-900">Family Expense Tracker</p>
        </div>
        <button onClick={() => setDrawerOpen(true)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-72 bg-white p-5 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Menu</p>
              <button onClick={() => setDrawerOpen(false)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={"end" in item ? item.end : false}
                  onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                      isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50"
                    )
                  }
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-6 border-t border-slate-100 pt-4">
              <UserSwitcher />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
