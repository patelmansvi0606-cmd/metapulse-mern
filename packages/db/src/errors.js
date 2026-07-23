/**
 * Base class for every error this app throws on purpose. Three things
 * every caller can rely on being present, whether they're an Express
 * error-handling middleware deciding a status code or a worker job loop
 * deciding whether to retry:
 *
 *   - code        machine-readable, stable across refactors (don't
 *                 rely on `message` for branching, it's for humans)
 *   - statusCode  the HTTP status an API layer should map this to
 *   - retryable   should the worker's job loop attempt this again?
 *
 * Anything that reaches a catch block *without* being an AppError is,
 * by definition, a bug or an unhandled third-party failure — treat it
 * as retryable=false and log it loudly rather than guessing.
 */
export class AppError extends Error {
  constructor(
    message,
    { code, statusCode = 500, retryable = false, cause } = {},
  ) {
    super(message, cause ? { cause } : undefined);
    this.name = this.constructor.name;
    this.code = code ?? "INTERNAL_ERROR";
    this.statusCode = statusCode;
    this.retryable = retryable;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/** Requested a document that doesn't exist, or exists but is soft-deleted. */
export class NotFoundError extends AppError {
  constructor(message = "Not found", opts = {}) {
    super(message, {
      code: "NOT_FOUND",
      statusCode: 404,
      retryable: false,
      ...opts,
    });
  }
}

/** Input failed schema validation (a Zod parse, typically) before it ever touched the DB. */
export class ValidationError extends AppError {
  constructor(message = "Validation failed", opts = {}) {
    super(message, {
      code: "VALIDATION_ERROR",
      statusCode: 400,
      retryable: false,
      ...opts,
    });
  }
}

/**
 * The tenancy gate. Thrown by tenancy.js when a user isn't a member of
 * the workspace they're trying to touch, or doesn't hold the minimum
 * role a given action requires. This is the app-layer stand-in for a
 * Postgres RLS policy denial — see tenancy.js for why it's the *only*
 * place allowed to throw this.
 */
export class ForbiddenError extends AppError {
  constructor(message = "Not permitted", opts = {}) {
    super(message, {
      code: "FORBIDDEN",
      statusCode: 403,
      retryable: false,
      ...opts,
    });
  }
}

/** Slug/email/unique-index collision, or any other "this already exists" state conflict. */
export class ConflictError extends AppError {
  constructor(message = "Conflict", opts = {}) {
    super(message, {
      code: "CONFLICT",
      statusCode: 409,
      retryable: false,
      ...opts,
    });
  }
}

/**
 * A failure the worker should retry without human intervention — a
 * dropped connection, a Mongo replica-set election in progress, a rate
 * limit. Distinct from IntegrationError because *this* one is about
 * our own infrastructure blinking, not a third party's.
 */
export class TransientError extends AppError {
  constructor(message = "Transient failure, safe to retry", opts = {}) {
    super(message, {
      code: "TRANSIENT_ERROR",
      statusCode: 503,
      retryable: true,
      ...opts,
    });
  }
}

/** A third-party integration (Meta Graph API, WhatsApp Cloud API, etc.) rejected or failed a call. */
export class IntegrationError extends AppError {
  constructor(message = "Upstream integration failed", opts = {}) {
    super(message, {
      code: "INTEGRATION_ERROR",
      statusCode: 502,
      retryable: true,
      ...opts,
    });
  }
}

/**
 * Thrown by the Model Router specifically, and *only* for "no AI
 * provider is configured to handle this task" — never for "the model
 * we called returned an error." That distinction is what lets
 * content-graph.js decide which nodes are allowed to fall back
 * silently and which must surface the failure. Not retryable: retrying
 * an absent API key doesn't make it appear.
 */
export class ProviderUnavailableError extends AppError {
  constructor(message = "No AI provider configured for this task", opts = {}) {
    super(message, {
      code: "PROVIDER_UNAVAILABLE",
      statusCode: 503,
      retryable: false,
      ...opts,
    });
  }
}

/** True for any error this module defines — the one place that list is allowed to live. */
export function isAppError(err) {
  return err instanceof AppError;
}
