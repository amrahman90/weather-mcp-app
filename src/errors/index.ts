export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_ERROR",
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfter: number;

  constructor(message: string, retryAfter: number) {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
    this.retryAfter = retryAfter;
  }
}

export class ExternalApiError extends AppError {
  public readonly service: string;

  constructor(service: string, message: string) {
    super(message, 502, "EXTERNAL_API_ERROR");
    this.service = service;
  }
}
