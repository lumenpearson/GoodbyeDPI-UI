/**
 * Module: constants.ts
 *
 * This module provides essential constants and utility values that serve as a foundation
 * for various operations within the application, such as path resolution, logging,
 * utility shared presets, and data size formatting.
 */

import type { ReplaceSysFolderMapping } from "@shared/types";
import path from "path";
import { fileURLToPath } from "url";

export const defaultPreset = "--wf-tcp 80,443 --wf-udp 443,50000-50090";

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);
export const __logDir = path.resolve("logs");
export const __utilitiesPath = path.resolve("bin");

export const FORMAT = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

export const DEFAULT_SYS_FOLDER_MAPPINGS: readonly ReplaceSysFolderMapping[] = [
  { longName: "Program Files", shortName: "Progra~1" },
  { longName: "Program Files (x86)", shortName: "Progra~2" },
  { longName: "ProgramData", shortName: "Progra~3" },
  { longName: "Users", shortName: "Users" },
  { longName: "Documents and Settings", shortName: "Docume~1" },
  { longName: "Application Data", shortName: "Applic~1" },
  { longName: "Local Settings", shortName: "LocalS~1" },
  { longName: "AppData", shortName: "AppDat~1" },
  { longName: "Temp", shortName: "Temp" },
  { longName: "Windows", shortName: "Window~1" },
  { longName: "System32", shortName: "System~1" },
  { longName: "SysWOW64", shortName: "SysWOW~1" },
  { longName: "Desktop", shortName: "Deskto~1" },
  { longName: "Downloads", shortName: "Downlo~1" },
  { longName: "Documents", shortName: "Docume~2" },
  { longName: "Pictures", shortName: "Pictur~1" },
  { longName: "Music", shortName: "Music~1" },
  { longName: "Videos", shortName: "Videos~1" },
];

export const GITHUB_SKIP_FILES = new Set([
  "custom_blacklist.txt",
  "list-discord.txt",
  "list-youtube.txt",
  "youtube.txt",
  "myhostlist.txt",
  "russia-blacklist.txt",
]);
