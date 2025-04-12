/**
 * Module: env.ts
 * Purpose: Handles environment variable configuration and validation using dotenv and envalid.
 *
 * Functions to Add:
 * - Any utilities related to managing or validating environment variables.
 *
 * Functions to Avoid:
 * - Any unrelated logic or utilities not tied to environment variables.
 */

import { LoggerLevelsEnum } from "@shared";
import { config } from "dotenv";
import envalid, { bool, str, url } from "envalid";

config({ path: "./.env" });

export const env = envalid.cleanEnv(process.env, {
  MAIN_VITE_SENTRY_DSN: url(),
  GITHUB_TOKEN: str(),
  LOG_LEVEL: str({
    choices: ["debug", "info", "warn", "error"],
    default: "info",
  }),
  LOG_USE_EMOJI: bool({ default: false }),
});

export const logLevel = env.LOG_LEVEL.toLowerCase() as LoggerLevelsEnum;
