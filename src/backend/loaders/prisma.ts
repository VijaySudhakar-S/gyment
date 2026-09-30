import { PrismaClient as AdminClient, Prisma } from "@adminDB/index";
import config from "@config/index";
import { BadRequestError } from "@errors/index";
import { capitalizeFirstLetter } from "@helpers/helpers";
import { PrismaClient as TenantClient } from "@tenantDB/index";
import { execSync } from "child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import {
  createPrismaClientOptions,
  getConnectionStringForSchema,
} from "./prismaClientFactory";

const prismaBinaryCandidates = [
  "./node_modules/.bin/prisma.cmd",
  "./node_modules/.bin/prisma",
  "npx prisma",
];

const tenantConfigCandidates = [
  "./prisma.tenant.config.ts",
  "./prisma.tenant.config.js",
];

const dbConnectionList = new Map<string, TenantClient>([
  ["public", new TenantClient(createPrismaClientOptions("public"))],
]);

export const adminDB = new AdminClient(createPrismaClientOptions("admin"));
export type AdminPrismaClient = AdminClient;
export type TenantPrismaClient = TenantClient;

const resolveExistingPath = (candidates: string[], label: string) => {
  const resolvedPath = candidates.find((candidate) => existsSync(candidate));
  if (!resolvedPath) {
    return candidates[0];
  }
  return resolvedPath;
};

// get tenant database connection
export const getDBConnection = (dbName: string): TenantClient => {
  if (!dbConnectionList.has(dbName)) {
    dbConnectionList.set(
      dbName,
      new TenantClient(createPrismaClientOptions(dbName)),
    );
  }
  return dbConnectionList.get(dbName)!;
};

// check unique in admin database
export const checkUniqueInAdminDB = async <T>(
  model: Prisma.ModelName,
  params: Partial<T>,
  id?: string,
) => {
  const keys = Object.keys(params);
  for (let index = 0; index < keys.length; index++) {
    const k = keys[index];
    const res = await (adminDB as any)[model].findFirst({
      where: { [k]: (params as any)[k], id: { not: id } },
    });
    if (res) {
      throw new BadRequestError(`${capitalizeFirstLetter(k)} already exists`);
    }
  }
};

// create and migrate new schema
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// create and migrate new schema asynchronously
export const createAndMigrateNewSchemaAsync = async (schemaName: string): Promise<void> => {
  const schemaPath = "./prisma/tenant/schema.prisma";
  const schema = readFileSync(schemaPath, "utf8");
  const configPath = resolveExistingPath(
    tenantConfigCandidates,
    "tenant Prisma config",
  );
  const prismaBinary = resolveExistingPath(
    prismaBinaryCandidates,
    "Prisma CLI binary",
  );
  const newSchemaPath = schemaPath.replace("schema.prisma", `${schemaName}.prisma`);

  writeFileSync(newSchemaPath, schema, "utf-8");

  try {
    await execAsync(
      `"${prismaBinary}" migrate deploy --schema "${newSchemaPath}" --config "${configPath}"`,
      {
        env: {
          ...process.env,
          DATABASE_URL_TENANT: getConnectionStringForSchema(schemaName),
        },
      },
    );
  } finally {
    if (existsSync(newSchemaPath)) {
      unlinkSync(newSchemaPath);
    }
  }
};

export const createAndMigrateNewSchema = createAndMigrateNewSchemaAsync;

(async () => {
  if (config.db.auto_migrate) {
    try {
      const gyms = await adminDB.gym.findMany();
      console.log("Tenant Gyms:", gyms.length);

      for (const gym of gyms) {
        try {
          await createAndMigrateNewSchemaAsync(gym.schemaName);
          console.log("Migrated tenant schema", gym.schemaName, "for", gym.name);
        } catch (error) {
          console.error("Error migrating tenant", gym.schemaName, error);
        }
      }

      console.log("Auto-migration completed for all tenant gyms.");
    } catch (e) {
      console.error("Auto-migration initialization failed:", e);
    }
  }
})();
