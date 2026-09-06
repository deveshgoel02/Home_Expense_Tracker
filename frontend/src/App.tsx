import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { RequireAuth } from "./components/RequireAuth";
import Login from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import Income from "./pages/Income";
import Budgets from "./pages/Budgets";
import BudgetPlanner from "./pages/BudgetPlanner";
import Family from "./pages/Family";
import MemberReport from "./pages/MemberReport";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/Settings";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RequireAuth />}>
        <Route path="/change-password" element={<ChangePassword forced />} />

        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/income" element={<Income />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/budget-planner" element={<BudgetPlanner />} />
          <Route path="/family" element={<Family />} />
          <Route path="/family/:id" element={<MemberReport />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
