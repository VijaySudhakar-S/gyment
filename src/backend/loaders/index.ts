import { Express } from "express";
import dependencyInjectorLoader from "./dependencyInjector";
import expressLoader from "./express";

export default async (expressApp: Express) => {
  dependencyInjectorLoader();
  expressLoader({ app: expressApp });
};
