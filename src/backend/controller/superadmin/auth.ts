import { NextFunction, Request, Response } from "express";
import { Logger } from "winston";
import Container from "typedi";
import { forgotPassword, loginUserDTO } from "@interface/user";
import AuthService from "@services/superadmin/authService";
import { LOGIN } from "@responseMessages/superadmin";
import { decodeJWT } from "@helpers/index";
import config from "@config/index";

export const loginController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const logger: Logger = Container.get("logger");
  try {
    const body: loginUserDTO = req.body;
    const authServiceInstance = Container.get(AuthService);
    const data = await authServiceInstance.login(body);

    return res.json({
      data,
      status: true,
      message: LOGIN.SUCCESS.LOGIN_SUCCESSFULLY,
    });
  } catch (e: any) {
    logger.error("Login controller error: %o", e.message);
    return next(e);
  }
};

export const forgotPasswordController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const logger: Logger = Container.get("logger");
  try {
    const body: forgotPassword = req.body;
    const authServiceInstance = Container.get(AuthService);
    const data = await authServiceInstance.forgotPassword(body.email);

    return res.json({
      status: true,
      data,
      message: LOGIN.SUCCESS.RESET_PASSWORD_LINK,
    });
  } catch (e: any) {
    logger.error("Forgot password controller error: %o", e.message);
    return next(e);
  }
};

export const readUserController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const logger: Logger = Container.get("logger");
  try {
    const authHeader = req.headers.authorization || "";
    const { id } = decodeJWT(authHeader, "token");
    const authServiceInstance = Container.get(AuthService);
    const data = await authServiceInstance.readUser(id);

    return res.json({
      data,
      status: true,
      message: LOGIN.SUCCESS.USER_DETAILES,
    });
  } catch (e: any) {
    logger.error("Read user controller error: %o", e);
    return next(e);
  }
};

export const resetPasswordController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const logger: Logger = Container.get("logger");
  try {
    const body = req.body;
    const authServiceInstance = Container.get(AuthService);
    const data = await authServiceInstance.resetPassword(body);

    return res.json({
      status: true,
      data,
      message: LOGIN.SUCCESS.RESET_PASSWORD,
    });
  } catch (e: any) {
    logger.error("Reset password controller error: %o", e);
    return next(e);
  }
};

export const validateResetTokenController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const logger: Logger = Container.get("logger");
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const authServiceInstance = Container.get(AuthService);
    const isValid = await authServiceInstance.validateTokenResetPass(id);

    return res.json({
      status: isValid,
      message: LOGIN.SUCCESS.RESET_PASSWORD_TOKEN_VALID,
    });
  } catch (e: any) {
    logger.error("Validate reset token controller error: %o", e);
    return next(e);
  }
};

export const getPublicKeyController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const logger: Logger = Container.get("logger");
  try {
    const pk = config.adminkeys.public_key;
    return res.json({
      status: true,
      data: {
        public_key: pk,
      },
      message: LOGIN.SUCCESS.PUBLIC_KEY_PATH,
    });
  } catch (e: any) {
    logger.error("Get public key controller error: %o", e);
    return next(e);
  }
};

export const refreshTokenController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const logger: Logger = Container.get("logger");
  try {
    const { refreshToken } = req.body;
    const authServiceInstance = Container.get(AuthService);
    const data = await authServiceInstance.refreshToken(refreshToken);

    return res.json({
      status: true,
      data,
      message: LOGIN.SUCCESS.REFRESH_TOKEN,
    });
  } catch (e: any) {
    logger.error("Refresh token controller error: %o", e);
    return next(e);
  }
};
