import { isCelebrateError } from "celebrate";
import { NextFunction, Request, Response } from "express";

export const errorMiddleware = (
  error: any,
  _request: Request,
  response: Response,
  _next: NextFunction
) => {
  const stack = process.env.NODE_ENV === "production" ? undefined : error?.stack;

  if (isCelebrateError(error)) {
    const errorMessages: string[] = [];
    for (const [, joiError] of error.details.entries()) {
      joiError.details.forEach((err) => errorMessages.push(err.message));
    }
    return response.status(400).json({
      status: false,
      message: "Validation Error",
      errors: errorMessages.length > 0 ? errorMessages : ["Input validation failed"],
      stack,
    });
  }

  const statusCode =
    error?.code === "P2025"
      ? 404
      : typeof error?.httpCode === "number"
      ? error.httpCode
      : 500;

  return response.status(statusCode).json({
    status: false,
    message: error?.message || "Internal server error",
    stack,
  });
};
