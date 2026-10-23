import winston from "winston";
import fs from "fs";
import path from "path";

const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const transports: winston.transport[] = [];

if (process.env.NODE_ENV !== "production") {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({
      dirname: "logs",
      filename: "app.log",
      maxsize: 5242880, // 5MB
      maxFiles: 2,
    })
  );
} else {
  transports.push(
    new winston.transports.File({
      dirname: "logs",
      filename: "app.log",
      maxsize: 5242880, // 5MB
      maxFiles: 2,
    })
  );
}

const LoggerInstance = winston.createLogger({
  level: "silly",
  levels: winston.config.npm.levels,
  exitOnError: false,
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports,
});

export default LoggerInstance;
