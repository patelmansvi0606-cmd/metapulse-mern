import { isAppError } from "@metapulse/db";
import { ZodError } from "zod";
import { isProduction } from "../config.js";

// eslint-disable-next-line no-unused-vars -- Express identifies error middleware by arity (4 params)
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request body",
        details: err.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
    });
  }

  if (isAppError(err)) {
    if (err.statusCode >= 500)
      console.error(`[${err.code}]`, err.message, err.cause ?? "");
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    });
  }

  // Anything reaching here is unexpected — log it in full, never leak
  // internals to the client.
  console.error("[UNHANDLED]", err);
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: isProduction ? "Something went wrong" : err.message,
    },
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `No route: ${req.method} ${req.path}`,
    },
  });
}
