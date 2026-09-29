import { config } from "dotenv";
import fs from "fs";
import path from "path";

const verify_env = config();

const privateKeyPath = process.env.PRIVATE_KEY_PATH || "adminPrivate.key";
const publicKeyPath = process.env.PUBLIC_KEY_PATH || "adminPublic.key";

const resolvedPrivateKey = path.isAbsolute(privateKeyPath)
  ? privateKeyPath
  : path.join(process.cwd(), "config", path.basename(privateKeyPath));

const resolvedPublicKey = path.isAbsolute(publicKeyPath)
  ? publicKeyPath
  : path.join(process.cwd(), "config", path.basename(publicKeyPath));

const adminPrivateKey = fs.existsSync(resolvedPrivateKey)
  ? fs.readFileSync(resolvedPrivateKey, "utf8")
  : "";

const adminPublicKey = fs.existsSync(resolvedPublicKey)
  ? fs.readFileSync(resolvedPublicKey, "utf8")
  : "";

export default {
  host: process.env.HOST || "localhost",
  port: Number(process.env.PORT || 8000),
  environment: process.env.NODE_ENV || "development",
  server: {
    host: process.env.SERVER_HOST || "http://localhost:8000",
  },
  adminkeys: {
    public_key: adminPublicKey,
    private_key: adminPrivateKey,
  },
  storage: {
    driver: (process.env.STORAGE_DRIVER || "local").toLowerCase().trim(),
    uploadDir: process.env.UPLOAD_DIR || "uploads",
  },
  client: {
    webHost: process.env.CLIENT_WEB_HOST || "http://localhost:3000",
  },
  db: {
    url: process.env.DATABASE_URL?.split("?schema=")[0] || "",
    auto_migrate: process.env.AUTO_MIGRATE === "true",
  },
  auth: {
    salt: Number(process.env.SALTROUND || 12),
  },
};
