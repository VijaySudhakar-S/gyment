import { Router } from "express";
import auth from "./auth";
import plan from "./plan";

const app = Router();

export default function () {
  auth(app);
  plan(app);
  return app;
}

