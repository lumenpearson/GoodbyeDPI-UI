/**
 * Module: paths.ts
 * Purpose: Provides utilities for working with file and directory paths.
 *
 * Functions to Add:
 * - Path-related helpers such as generating, validating, or transforming paths.
 *
 * Functions to Avoid:
 * - Any logic unrelated to paths or file system management.
 */

import { Logger } from "@index";
import { FSFileService } from "@services";
import type { ReplaceSysFolderMapping, ReplaceSysFolderOptions } from "@shared";
import { DEFAULT_SYS_FOLDER_MAPPINGS } from "@shared/constants";
import { getOpenCommand } from "@utils";
import { exec } from "child_process";
import { constants } from "fs/promises";
import path from "path";

export const backupPath = (utilPath: string) =>
  path.join(__dirname, "backup", path.basename(utilPath));

export function replaceSysFoldersWithShortNames(
  pathString: string,
  mappings: readonly ReplaceSysFolderMapping[] = DEFAULT_SYS_FOLDER_MAPPINGS,
  options: ReplaceSysFolderOptions = {}
): string {
  const separator = options.separator || path.sep;
  const pathParts = pathString.split(separator);

  const newPathParts = pathParts.map((part) => {
    const mapping = mappings.find((m) => m.longName === part);
    return mapping ? mapping.shortName : part;
  });

  return newPathParts.join(separator);
}

export async function checkFileExists(path: string): Promise<boolean> {
  try {
    await new FSFileService().access(path, constants.R_OK | constants.W_OK);
    return true;
  } catch (_) {
    return false;
  }
}

export async function externalOpenFolder(folderPath: string): Promise<void> {
  const resolvedPath = path.resolve(folderPath);

  if (
    !new FSFileService().exists(resolvedPath) ||
    !(await new FSFileService().stat(resolvedPath)).isDirectory()
  ) {
    throw new Error(`Folder not found: ${resolvedPath}`);
  }

  const command = getOpenCommand(resolvedPath);

  try {
    exec(command);
  } catch (error: any) {
    Logger.error(`Failed to open folder: ${error.message}`);
  }
}
