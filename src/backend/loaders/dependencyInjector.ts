import { Container } from "typedi";
import Logger from "./logger";
import { adminDB, getDBConnection } from "./prisma";

export default () => {
  try {
    Container.set("logger", Logger);
    Container.set("adminDB", adminDB);
    Container.set("tenantDBFactory", getDBConnection);
    Logger.info("Dependency injected into container");
  } catch (e) {
    Logger.error("Error on dependency injector loader: %o", e);
    throw e;
  }
};
