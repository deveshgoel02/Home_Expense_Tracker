import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError, ValidationError } from "../utils/errors.js";

export function asyncHandler<T extends (req: Request, res: Response, next: NextFunction) => Promise<unknown>>(
  fn: T
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.flatten(),
    });
  }

  if (err instanceof ValidationError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message });
  }

  console.error("Unhandled error:", err);
  return res.status(500).json({ error: "Internal server error" });
}
