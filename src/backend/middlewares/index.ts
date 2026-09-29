import { AuthMiddleware } from "./auth";
import { errorMiddleware } from "./error";
import { loggingMiddleware } from "./logging";

export default {
  logging: loggingMiddleware,
  error: errorMiddleware,
  auth: {
    admin: AuthMiddleware,
  },
};
