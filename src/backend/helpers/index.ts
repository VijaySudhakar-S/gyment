import config from "@config/index";
import { generateKeyPairSync } from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { RefreshTokenError, UnauthorizedError } from "@errors/index";
import { RoleType, tokenDTO } from "@interface/auth";

// resolve private key
const resolvePrivateKey = (key?: string, role?: RoleType) => {
  if (key) return key;
  return config.adminkeys.private_key;
};

// resolve public key
const resolvePublicKey = (key?: string, role?: RoleType) => {
  if (key) return key;
  return config.adminkeys.public_key;
};

// generate login token
export const generateLoginToken = (
  data: tokenDTO,
  key?: string,
): { token: string; refreshtoken: string } => {
  const privateKey = resolvePrivateKey(key, data.role);
  if (!privateKey) {
    throw new Error("Private key is not configured for signing JWT.");
  }
  const token = jwt.sign(data, privateKey, {
    expiresIn: "8h",
    algorithm: "RS256",
  });
  const refreshtoken = jwt.sign(data, privateKey, {
    expiresIn: "3d",
    algorithm: "RS256",
  });
  return { token, refreshtoken };
};

// generate reset password token
export const generateResetPasswordToken = (
  data: tokenDTO,
  key?: string,
): string => {
  const privateKey = resolvePrivateKey(key, data.role);
  const token = jwt.sign(data, privateKey, {
    expiresIn: "10m",
    algorithm: "RS256",
  });
  return token;
};

// verify token
export const verifyToken = (
  token: string,
  key?: string,
  role?: RoleType,
): Promise<{ tokenDetails: any; error: boolean; message: string }> => {
  const publicKey = resolvePublicKey(key, role);
  return new Promise((resolve, reject) => {
    jwt.verify(token, publicKey, { algorithms: ["RS256"] }, (err, tokenDetails) => {
      if (err) {
        return reject(
          new RefreshTokenError({
            error: true,
            message: "Invalid refresh token",
            errormessage: err.message,
          }),
        );
      }
      resolve({
        tokenDetails,
        error: false,
        message: "Valid refresh token",
      });
    });
  });
};

// exclude keys
export const exclude = <T, Key extends keyof T>(
  data: T,
  keys: Key[],
): Omit<T, Key> => {
  return Object.fromEntries(
    Object.entries(data as any).filter(([k]) => !keys.includes(k as Key)),
  ) as Omit<T, Key>;
};

// generate keys
export const generateKeys = () => {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "pkcs1",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });
  return {
    publicKey: Buffer.from(publicKey).toString("base64"),
    privateKey: Buffer.from(privateKey).toString("base64"),
  };
};

// decode keys
export const decodeKeys = (key: string) => {
  const decoded = Buffer.from(key, "base64").toString();
  return JSON.parse(decoded);
};

// concat gym name and gym id for unique domain
export const concatDomain = (code: string, id: string) => {
  const domainStart = code.slice(0, 6).toLowerCase();
  const domainEnd = id.slice(-5).toLowerCase();
  return `gym_${domainStart}_${domainEnd}`;
};

// hash password
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(config.auth.salt || 12);
  const hash: string = await bcrypt.hash(password, salt);
  return hash;
};

// decode JWT
export const decodeJWT = (token: string, type?: string): tokenDTO => {
  if (!token) {
    throw new UnauthorizedError("Token is required");
  }
  let rawToken = token;
  if (type === "token" || rawToken.startsWith("Bearer ")) {
    rawToken = rawToken.replace(/^Bearer\s+/i, "");
  }
  const payload = jwt.decode(rawToken, { complete: true });
  if (!payload || !payload.payload) {
    throw new UnauthorizedError("Invalid token");
  }
  return payload.payload as tokenDTO;
};
