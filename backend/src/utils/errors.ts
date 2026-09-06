export class AppError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string) {
    super(404, `${entity} not found`);
  }
}

export class ValidationError extends AppError {
  details: unknown;
  constructor(message: string, details?: unknown) {
    super(400, message);
    this.details = details;
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
  }
}
