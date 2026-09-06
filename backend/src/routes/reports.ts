import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { periodQuerySchema } from "../validation.js";
import { buildMemberReport, buildMonthlyReport } from "../services/reportService.js";
import { NotFoundError } from "../utils/errors.js";
import { requireAuth } from "../middleware/auth.js";

export const reportsRouter = Router();
reportsRouter.use(requireAuth);

function resolvePeriod(req: import("express").Request) {
  const now = new Date();
  return periodQuerySchema.parse({
    month: req.query.month ?? now.getMonth() + 1,
    year: req.query.year ?? now.getFullYear(),
  });
}

reportsRouter.get(
  "/monthly",
  asyncHandler(async (req, res) => {
    const { month, year } = resolvePeriod(req);
    res.json(await buildMonthlyReport(month, year));
  })
);

reportsRouter.get(
  "/member/:id",
  asyncHandler(async (req, res) => {
    const { month, year } = resolvePeriod(req);
    const report = await buildMemberReport(req.params.id, month, year);
    if (!report) throw new NotFoundError("User");
    res.json(report);
  })
);
