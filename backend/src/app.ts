import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/auth.js";
import { adminRouter } from "./routes/admin.js";
import { usersRouter } from "./routes/users.js";
import { categoriesRouter } from "./routes/categories.js";
import { expensesRouter } from "./routes/expenses.js";
import { incomeRouter } from "./routes/income.js";
import { budgetsRouter } from "./routes/budgets.js";
import { budgetPlannerRouter } from "./routes/budgetPlanner.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { reportsRouter } from "./routes/reports.js";
import { settingsRouter } from "./routes/settings.js";

// Accepts the configured FRONTEND_URL, any *.vercel.app preview deployment
// (so pull-request previews work without touching this env var each time),
// and the Capacitor Android app's bundled-assets origin (androidScheme:
// 'https' in capacitor.config.ts serves local assets from https://localhost;
// iOS's default capacitor://localhost is also allowed in case that's added later).
const CAPACITOR_ORIGINS = new Set(["https://localhost", "capacitor://localhost"]);

function buildCorsOrigin() {
  const configured = process.env.FRONTEND_URL ?? "http://localhost:5173";
  return (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || origin === configured || CAPACITOR_ORIGINS.has(origin)) return callback(null, true);
    try {
      if (/\.vercel\.app$/.test(new URL(origin).hostname)) return callback(null, true);
    } catch {
      // malformed Origin header — fall through to reject
    }
    return callback(null, false);
  };
}

// A generous ceiling that only kicks in against abuse/bugs, not real usage —
// this is a 6-person household app, not a public API.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
});

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1); // Render/Vercel sit behind a proxy; needed for correct rate-limit IPs and secure cookies
  // This is a pure JSON API called cross-origin from the Vercel frontend, so
  // relax the resource-policy default that assumes a same-origin web app.
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: buildCorsOrigin(), credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use("/api", apiLimiter);

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/auth", authRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/categories", categoriesRouter);
  app.use("/api/expenses", expensesRouter);
  app.use("/api/income", incomeRouter);
  app.use("/api/budgets", budgetsRouter);
  app.use("/api/budget-planner", budgetPlannerRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api/settings", settingsRouter);

  app.use((req, res) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
  });

  app.use(errorHandler);

  return app;
}
