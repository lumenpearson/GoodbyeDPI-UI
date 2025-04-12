export * from "@workers/utility-manager";

import * as Sentry from "@sentry/node";
import { nodeContextIntegration } from "@sentry/node";
import { LoggerLevelsEnum, ProcessOutputType } from "@shared";
import { __logDir } from "@shared/constants";
import { env, executeCommand, logLevel } from "@utils";
import chalk, { ChalkInstance } from "chalk";

import path from "path";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

Sentry.init({
  dsn: env.MAIN_VITE_SENTRY_DSN,
  integrations: [nodeContextIntegration()],
  tracesSampleRate: 1.0,
});

export async function formatProcessOutput(
  data: Buffer,
  type: ProcessOutputType
): Promise<void> {
  const formattedData = data.toString().trim();
  if (type === ProcessOutputType.STDOUT) {
    Logger.info(formattedData);
  } else if (type === ProcessOutputType.STDERR) {
    Logger.error(formattedData);
  }
}

const getLogFilenameWithTimestamp = (): string => {
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const time = `${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}-${String(now.getSeconds()).padStart(2, "0")}`;
  return `${date}_${time}`;
};

export function getLoggerLevel(): LoggerLevelsEnum {
  if (Object.values(LoggerLevelsEnum).includes(logLevel)) {
    return logLevel;
  }
  console.warn(
    `Неверное значение [.env]::LOG_LEVEL: "${logLevel}". Используется значение по умолчанию: "info".`
  );
  return LoggerLevelsEnum.INFO;
}

const consoleFormat = winston.format.printf(
  ({ level, message, timestamp }: winston.Logform.TransformableInfo) => {
    const formattedTimestamp = timestamp || new Date().toISOString();

    const colors: Record<LoggerLevelsEnum, ChalkInstance> = {
      [LoggerLevelsEnum.ERROR]: chalk.red,
      [LoggerLevelsEnum.WARN]: chalk.yellow,
      [LoggerLevelsEnum.INFO]: chalk.green,
      [LoggerLevelsEnum.DEBUG]: chalk.blue,
      [LoggerLevelsEnum.VERBOSE]: chalk.white,
    };

    const emojis: Record<LoggerLevelsEnum, string> = {
      [LoggerLevelsEnum.ERROR]: "❌",
      [LoggerLevelsEnum.WARN]: "⚠️",
      [LoggerLevelsEnum.INFO]: "ℹ️",
      [LoggerLevelsEnum.DEBUG]: "🛠️",
      [LoggerLevelsEnum.VERBOSE]: "🔍",
    };

    const timestampColor = chalk.gray;
    const levelColor =
      colors[level as LoggerLevelsEnum].bold || chalk.white.bold;
    const messageColor = colors[level as LoggerLevelsEnum] || chalk.white.bold;

    return `${timestampColor(`[${formattedTimestamp}]`)} ${levelColor(
      env.LOG_USE_EMOJI
        ? `${emojis[level as LoggerLevelsEnum]} ${level.toUpperCase()}`
        : levelColor(level.toUpperCase())
    )}: ${messageColor(message)}`;
  }
);

export const Logger = winston.createLogger({
  level: getLoggerLevel(),
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
    consoleFormat
  ),
  transports: [
    new DailyRotateFile({
      dirname: __logDir,
      extension: ".log",
      datePattern: getLogFilenameWithTimestamp(),
      maxFiles: "14d",
      maxSize: "10m",
      json: false,
      handleExceptions: true,
      auditFile: path.join(__logDir, "audits/error.audit.json"),
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
        consoleFormat
      ),
    }),
    new winston.transports.File({
      filename: path.join(__logDir, "log-rotation-file.log"),
      format: winston.format.json(),
    }),
  ],
});

export async function stopDriverManually() {
  try {
    ["WinDivert", "WinDivert64", "windivert14", '"ZapretService"'].forEach(
      async (service) => {
        await executeCommand("sc", ["stop", service]);
        await executeCommand("sc", ["delete", service]);
      }
    );
  } catch (error) {
    Logger.error(
      "Error while stopping or deleting service:",
      error instanceof Error ? error.message : String(error)
    );
    Sentry.captureException(error);
  }
}

Sentry.profiler.startProfiler();
// Sentry.startSpan(
//   {
//     name: "Production Sentry Tracing Span",
//   },
//   () => {
//     try {
//       start();
//     } catch (e) {
//       Sentry.captureException(e);
//     }
//   }
// );

process.on("warning", (warning) => {
  Logger.warn(warning.stack);
});
process.on("uncaughtException", (error) => {
  Logger.error("Uncaught Exception:", error);
  Sentry.captureException(new Error(error.stack));
});
process.on("unhandledRejection", (reason) => {
  Logger.verbose("Unhandled Rejection:", reason);
  // Sentry.captureException(reason);
});

Sentry.profiler.stopProfiler();
