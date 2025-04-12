/**
 * Module: system.ts
 * Purpose: Utilities related to system-level operations like OS architecture and command execution.
 *
 * Functions to Add:
 * - Utilities for interacting with the operating system or executing system-level commands.
 *
 * Functions to Avoid:
 * - Application-specific logic or unrelated utilities not tied to system operations.
 */

import { Logger } from "@index";
import { spawn } from "child_process";
import { arch, platform } from "os";

export function _getArch(): string | undefined {
  return `${arch() === "x64" ? "_x64" : "_x86"}${platform() === "win32" ? ".exe" : undefined}`;
}

export function getOpenCommand(folderPath: string): string {
  switch (process.platform) {
    case "win32":
      return `explorer "${folderPath}"`;
    case "darwin":
      return `open "${folderPath}"`;
    case "linux":
      return `xdg-open "${folderPath}"`;
    default:
      throw new Error("Unsupported platform.");
  }
}

export function executeCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { stdio: "inherit" });

    process.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        const errorMessage = `Command "${command} ${args.join(" ")}" failed with code ${code}`;
        reject(Logger.error(errorMessage));
      }
    });
  });
}
