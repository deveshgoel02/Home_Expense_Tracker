import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import Income from "./pages/Income";
import Budgets from "./pages/Budgets";
import Family from "./pages/Family";
import MemberReport from "./pages/MemberReport";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/Settings";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/income" element={<Income />} />
        <Route path="/budgets" element={<Budgets />} />
        <Route path="/family" element={<Family />} />
        <Route path="/family/:id" element={<MemberReport />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
