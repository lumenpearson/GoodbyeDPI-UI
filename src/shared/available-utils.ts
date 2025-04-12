/**
 * Module: available-utils.ts
 * Purpose: Defines a list of available utilities/tools and their metadata.
 *
 * Variables to Add:
 * - Additional utility configurations or metadata.
 *
 * Variables to Avoid:
 * - Any unrelated data or logic that doesn't describe utilities/tools.
 */

import type { Utility } from "@shared";

export const availableUtils: readonly Utility[] = [
  {
    name: "GoodbyeDPI",
    path: "goodbyedpi/x86_64",
    file: "goodbyedpi.exe",
    meta: {
      links: { author: "ValdikSS", repo: "goodbyeDPI" },
    },
    runtimeOptions: {
      fallbackLog: false,
      fileCheck: {
        onLaunch: true,
        onRestart: true,
      },
    },
    updateOptions: {
      refBranch: "main",
      hooks: {
        preHooks: [],
        postHooks: [],
      },
      downloadReleaseOnUpdate: true,
      downloadFiles: {
        include: [],
        exclude: [],
      },
      backupBeforeUpdate: true,
      skipUpdateOnRunning: true,
      forceUpdate: false,
      preserveConfig: true,
    },
  },
  {
    name: "Zapret",
    path: "zapret",
    file: "winws.exe",
    meta: {
      links: { author: "bol-van", repo: "zapret-win-bundle" },
    },
    runtimeOptions: {
      fallbackLog: false,
      fileCheck: {
        onLaunch: true,
        onRestart: true,
      },
    },
    updateOptions: {
      refBranch: "main",
      hooks: {
        preHooks: [],
        postHooks: [],
      },
      downloadReleaseOnUpdate: false,
      downloadFiles: {
        include: ["./zapret-winws/**"],
        exclude: [],
      },
      backupBeforeUpdate: true,
      skipUpdateOnRunning: true,
      forceUpdate: false,
      preserveConfig: true,
    },
  },
  {
    name: "ByeDPI",
    path: "byedpi",
    file: "ciadpi.exe",
    meta: {
      links: { author: "hufrea", repo: "byedpi" },
    },
    runtimeOptions: {
      fallbackLog: true,
      fileCheck: {
        onLaunch: true,
        onRestart: true,
      },
    },
    updateOptions: {
      refBranch: "main",
      hooks: {
        preHooks: [],
        postHooks: [],
      },
      downloadReleaseOnUpdate: true,
      downloadFiles: {
        include: [],
        exclude: [],
      },
      backupBeforeUpdate: true,
      skipUpdateOnRunning: true,
      forceUpdate: false,
      preserveConfig: true,
    },
  },
  {
    name: "SpoofDPI",
    path: "spoofdpi",
    file: "spoofdpi-windows-amd64.exe",
    meta: {
      links: { author: "xvzc", repo: "SpoofDPI" },
    },
    runtimeOptions: {
      fallbackLog: false,
      fileCheck: {
        onLaunch: true,
        onRestart: true,
      },
    },
    updateOptions: {
      refBranch: "main",
      hooks: {
        preHooks: [],
        postHooks: [],
      },
      downloadReleaseOnUpdate: true,
      downloadFiles: {
        include: [],
        exclude: [],
      },
      backupBeforeUpdate: true,
      skipUpdateOnRunning: true,
      forceUpdate: false,
      preserveConfig: true,
    },
  },
];

export const AvailableUtilsEnum: Readonly<Record<string, string>> =
  Object.freeze(
    availableUtils.reduce(
      (acc, util) => {
        acc[util.name] = util.name;
        return acc;
      },
      {} as Record<string, string>
    )
  );
