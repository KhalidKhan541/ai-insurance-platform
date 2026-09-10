export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_ERROR",
    isOperational: boolean = true,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, "BAD_REQUEST", true, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} with id ${id} not found`
      : `${resource} not found`;
    super(message, 404, "NOT_FOUND", true, { resource, id });
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 409, "CONFLICT", true, details);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    errors: Record<string, string[]>
  ) {
    super(message, 422, "VALIDATION_ERROR", true, { errors });
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Too many requests") {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string) {
    super(`External service error (${service}): ${message}`, 502, "EXTERNAL_SERVICE_ERROR", false, { service });
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(`Database error: ${message}`, 500, "DATABASE_ERROR", false, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication failed") {
    super(message, 401, "AUTHENTICATION_ERROR");
  }
}

export class InsuranceBusinessError extends AppError {
  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message, 400, code, true, details);
  }
}

export class PolicyExpiredError extends InsuranceBusinessError {
  constructor(policyId: string) {
    super("Policy has expired", "POLICY_EXPIRED", { policyId });
  }
}

export class PolicyCancelledError extends InsuranceBusinessError {
  constructor(policyId: string) {
    super("Policy has been cancelled", "POLICY_CANCELLED", { policyId });
  }
}

export class ClaimAmountExceedsPolicyError extends InsuranceBusinessError {
  constructor(claimAmount: number, coverageLimit: number) {
    super(
      `Claim amount ${claimAmount} exceeds coverage limit ${coverageLimit}`,
      "CLAIM_EXCEEDS_COVERAGE",
      { claimAmount, coverageLimit }
    );
  }
}

export class DuplicateClaimError extends InsuranceBusinessError {
  constructor(policyId: string, dateOfIncident: Date) {
    super(
      "A similar claim already exists for this policy and date",
      "DUPLICATE_CLAIM",
      { policyId, dateOfIncident }
    );
  }
}

export class InvalidStatusTransitionError extends InsuranceBusinessError {
  constructor(entity: string, from: string, to: string) {
    super(
      `Invalid status transition from ${from} to ${to} for ${entity}`,
      "INVALID_STATUS_TRANSITION",
      { entity, from, to }
    );
  }
}

export function handleError(error: unknown): {
  statusCode: number;
  message: string;
  code: string;
  details?: Record<string, unknown>;
} {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      code: error.code,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    return {
      statusCode: 500,
      message:
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : error.message,
      code: "INTERNAL_ERROR",
    };
  }

  return {
    statusCode: 500,
    message: "An unknown error occurred",
    code: "UNKNOWN_ERROR",
  };
}
