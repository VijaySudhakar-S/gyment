import compression from "compression";
import cors from "cors";
import helmet from "helmet";
import express, { Express, Request, Response } from "express";
import middleware from "@middlewares/index";
import Logger from "./logger";
import superAdminRoutes from "@api/v1/superadmin/index";

export default ({ app }: { app: Express }) => {
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.enable("trust proxy");

  const allowedOrigins = process.env.CLIENT_WEB_HOST
    ? process.env.CLIENT_WEB_HOST.split(",").map((origin) => origin.trim())
    : ["http://localhost:3000", "http://localhost:5173"];

  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === "development") {
        return callback(null, true);
      }
      return callback(new Error("CORS not allowed for this origin"));
    },
    credentials: true,
  };

  app.use(cors(corsOptions));
  app.use(compression({}));

  app.get("/health_check", (_req, res) => {
    res.status(200).json({
      status: true,
      message: "Gyment API Server is running smoothly",
      timestamp: new Date(),
    });
  });
  app.head("/health_check", (_req, res) => {
    res.status(200).end();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));
  app.use(middleware.logging);

  // Routes
  app.use("/api/v1/superadmin", superAdminRoutes());

  // Catch 404
  app.use((req, res) => {
    return res.status(404).json({
      status: false,
      message: `${req.method} at ${req.path} not found`,
    });
  });

  // Celebrate and global error middleware
  app.use(middleware.error);

  // Fallback error handler
  app.use((error: any, _req: Request, res: Response, _next: any) => {
    return res.status(error.httpCode || 500).json({
      status: false,
      message: error.message || "Internal server error",
    });
  });

  Logger.info("Express loader configured successfully.");
};
