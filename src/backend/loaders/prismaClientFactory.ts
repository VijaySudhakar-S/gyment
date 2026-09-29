import { PrismaPg } from "@prisma/adapter-pg";
import type { Prisma as AdminPrisma } from "@adminDB/index";
import config from "@config/index";

type PrismaClientOptions = AdminPrisma.PrismaClientOptions;

const requireBaseUrl = () => {
  if (!config.db.url) {
    throw new Error("DATABASE_URL is not configured");
  }
  return config.db.url;
};

export const buildConnectionString = (schema: string) =>
  `${requireBaseUrl()}?schema=${schema}`;

const createPgAdapter = (schema: string) => {
  return new PrismaPg(
    { connectionString: buildConnectionString(schema) },
    { schema }
  );
};

export const createPrismaClientOptions = (schema: string) =>
  ({
    adapter: createPgAdapter(schema),
    errorFormat: "pretty",
  }) satisfies PrismaClientOptions;

export const getConnectionStringForSchema = (schema: string) =>
  buildConnectionString(schema);
