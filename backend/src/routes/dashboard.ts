import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { periodQuerySchema } from "../validation.js";
import { buildDashboard } from "../services/reportService.js";
import { requireAuth } from "../middleware/auth.js";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const now = new Date();
    const { month, year } = periodQuerySchema.parse({
      month: req.query.month ?? now.getMonth() + 1,
      year: req.query.year ?? now.getFullYear(),
    });
    const dashboard = await buildDashboard(month, year);
    res.json(dashboard);
  })
);
