import { config } from "dotenv";
config();

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/admin/schema.prisma",
  migrations: {
    path: "prisma/admin/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
