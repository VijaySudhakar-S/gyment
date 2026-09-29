import { NextFunction, Request, Response } from "express";
import Container from "typedi";
import { Logger } from "winston";

export const loggingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const logger: Logger = Container.get("logger");
    const started = Date.now();

    logger.info("Request %s %s - %o", req.method, req.path, {
      body: req.body,
      query: req.query,
      params: req.params,
      origin: req.headers.origin ?? "localhost",
      http_method: req.method,
    });

    res.on("finish", () => {
      const level =
        res.statusCode >= 500
          ? "error"
          : res.statusCode >= 400
          ? "warn"
          : "info";

      logger[level]("Response %s %s %s - %o", `[${res.statusCode}]`, req.method, req.path, {
        duration: `${Date.now() - started}ms`,
        action_method: `${req.baseUrl}`,
        status: res.statusCode,
      });
    });
  } catch (err) {
    console.error("Logging middleware error:", err);
  }
  next();
};
