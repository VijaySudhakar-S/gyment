export class HttpError extends Error {
  httpCode: number;

  constructor(httpCode: number, message?: string) {
    super(message);
    Object.setPrototypeOf(this, HttpError.prototype);

    this.httpCode = httpCode || 500;
    if (message) this.message = message;
    if (process.env.NODE_ENV === "development") {
      this.stack = new Error().stack;
    }
  }
}

export class BadRequestError extends HttpError {
  name = "BadRequestError";

  constructor(message?: string) {
    super(400, message);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

export class ForbiddenError extends HttpError {
  name = "ForbiddenError";

  constructor(message?: string) {
    super(403, message);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class ConflictError extends HttpError {
  name = "ConflictError";

  constructor(message?: string) {
    super(409, message);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class InternalServerError extends HttpError {
  name = "InternalServerError";

  constructor(message: string) {
    super(500, message);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

export class MethodNotAllowedError extends HttpError {
  name = "MethodNotAllowedError";

  constructor(message?: string) {
    super(405, message);
    Object.setPrototypeOf(this, MethodNotAllowedError.prototype);
  }
}

export class NotFoundError extends HttpError {
  name = "NotFoundError";

  constructor(message?: string) {
    super(404, message);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class UnauthorizedError extends HttpError {
  name = "UnauthorizedError";

  constructor(message?: string) {
    super(401, message);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class RefreshTokenError extends HttpError {
  name = "RefreshTokenError";

  constructor(data: {
    error: boolean;
    message: string;
    errormessage?: string;
  }) {
    super(498, data.errormessage || data.message);
    Object.setPrototypeOf(this, RefreshTokenError.prototype);
  }
}
