import "reflect-metadata";
import express from "express";
import config from "@config/index";
import loaders from "@loaders/index";
import logger from "@loaders/logger";

const app = express();

(async () => {
  try {
    await loaders(app);
    const port = config.port || 8000;
    const server = app.listen(port, () => {
      logger.info(`Gyment Backend Server listening on ${config.host}:${port}`);
      console.log(`Gyment Backend running at: http://${config.host}:${port}`);
    });
    server.on("error", (error) => {
      logger.error("Server error: %o", error);
      process.exit(1);
    });
  } catch (e) {
    logger.error("Failed to start server: %o", e);
  }
})();

export default app;
