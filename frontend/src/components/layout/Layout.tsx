import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { Topbar } from "./Topbar";
import { AddExpenseModal } from "../expenses/AddExpenseModal";

export function Layout() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-8 lg:pt-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileNav />
      <AddExpenseModal />
    </div>
  );
}
