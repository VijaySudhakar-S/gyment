import {
  bodywithRefreshToken,
  loginSchema,
  paramsWithUUID,
  resetPasswordSchema,
} from "@helpers/validation/validation";
import {
  forgotPasswordController,
  getPublicKeyController,
  loginController,
  readUserController,
  refreshTokenController,
  resetPasswordController,
  validateResetTokenController,
} from "@controller/superadmin/auth";
import { Router } from "express";
import { AuthMiddleware } from "@middlewares/auth";

export default (app: Router) => {
  const route = Router();
  app.use("/auth", route);

  route.post("/login", loginSchema, loginController);
  route.post("/forgot-password", forgotPasswordController);
  route.post("/refreshtoken", bodywithRefreshToken, refreshTokenController);
  route.get("/user-details", AuthMiddleware(["SUPER_ADMIN"]), readUserController);
  route.post("/reset-password", resetPasswordSchema, resetPasswordController);
  route.get(
    "/reset-password/:id",
    paramsWithUUID,
    validateResetTokenController,
  );
  route.get("/pk", getPublicKeyController);
};
