import { ForbiddenError, UnauthorizedError } from "@errors/index";
import config from "@config/index";
import { adminDB } from "@loaders/prisma";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const AuthMiddleware = (
  roles?: ("SUPER_ADMIN" | "GYM_ADMIN" | "MANAGER" | "TRAINER" | "STAFF" | "FRONT_DESK")[]
) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      const queryToken = req.query.token as string | undefined;

      let token: string | undefined;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      } else if (queryToken) {
        token = queryToken;
      }

      if (!token) {
        return res.status(401).json({
          status: false,
          message: "No token provided. Authorization denied.",
        });
      }

      const publicKey = config.adminkeys?.public_key;
      if (!publicKey) {
        return res.status(500).json({
          status: false,
          message: "Public key is not configured for token verification.",
        });
      }

      let decoded: any;
      try {
        decoded = jwt.verify(token, publicKey, { algorithms: ["RS256"] });
      } catch (err: any) {
        return res.status(401).json({
          status: false,
          message: "Invalid or expired token.",
          error: err.message,
        });
      }

      if (roles && roles.length > 0) {
        if (!roles.includes(decoded.role)) {
          return res.status(403).json({
            status: false,
            message: "You do not have permission to access this resource.",
          });
        }
      }

      if (decoded.role === "SUPER_ADMIN") {
        const admin = await adminDB.superAdmin.findUnique({
          where: { id: decoded.id },
        });

        if (!admin || !admin.isActive) {
          return res.status(401).json({
            status: false,
            message: "SuperAdmin account not found or deactivated.",
          });
        }

        const { passwordHash, ...safeAdmin } = admin;
        req.user = safeAdmin;
      }

      next();
    } catch (e: any) {
      return res.status(500).json({
        status: false,
        message: e.message || "Authentication error",
      });
    }
  };
};
