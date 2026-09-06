import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/errorHandler.js";
import { usersRouter } from "./routes/users.js";
import { categoriesRouter } from "./routes/categories.js";
import { expensesRouter } from "./routes/expenses.js";
import { incomeRouter } from "./routes/income.js";
import { budgetsRouter } from "./routes/budgets.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { reportsRouter } from "./routes/reports.js";
import { settingsRouter } from "./routes/settings.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:5173" }));
  app.use(express.json());

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/users", usersRouter);
  app.use("/api/categories", categoriesRouter);
  app.use("/api/expenses", expensesRouter);
  app.use("/api/income", incomeRouter);
  app.use("/api/budgets", budgetsRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api/settings", settingsRouter);

  app.use((req, res) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
  });

  app.use(errorHandler);

  return app;
}
