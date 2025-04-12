/**
 * Module: types.ts
 * Purpose: Defines shared types and interfaces used throughout the project.
 *
 * Types/Interfaces to Add:
 * - Any shared data structures or types used across multiple modules.
 *
 * Types/Interfaces to Avoid:
 * - Implementation-specific types or interfaces not shared between modules.
 */

import { ChildProcess } from "child_process";
import { Abortable } from "events";
import {
  BigIntStats,
  MakeDirectoryOptions,
  Mode,
  ObjectEncodingOptions,
  OpenMode,
  PathLike,
  RmDirOptions,
  RmOptions,
  StatOptions,
  Stats,
} from "fs";
import { FileHandle } from "fs/promises";
import { Stream } from "stream";

export interface IGithubRelease {
  tag_name: string;
  name: string;
  body?: string;
}

export interface IGithubFile {
  name: string;
  type: string;
  download_url: string;
}

// export interface IGithubService {}

export interface IFSFileService {
  exists(path: PathLike): Promise<boolean>;
  mkdir(
    path: PathLike,
    options?: Mode | MakeDirectoryOptions | null
  ): Promise<string | undefined>;
  stat(path: PathLike, opts?: StatOptions): Promise<Stats | BigIntStats>;
  rmdir(path: PathLike, options?: RmDirOptions): Promise<void>;
  rm(path: PathLike, options?: RmOptions): Promise<void>;
  unlink(path: PathLike): Promise<void>;
  writeFile(
    file: PathLike | FileHandle,
    data:
      | string
      | NodeJS.ArrayBufferView
      | Iterable<string | NodeJS.ArrayBufferView>
      | AsyncIterable<string | NodeJS.ArrayBufferView>
      | Stream,
    options?:
      | (ObjectEncodingOptions & {
          mode?: Mode | undefined;
          flag?: OpenMode | undefined;
          flush?: boolean | undefined;
        } & Abortable)
      | BufferEncoding
      | null
  ): Promise<void>;
}

export interface IUtilityManager {
  stop(utilName: string | null, pid: number | null): Promise<boolean>;
  run(utilName: string, args: string | null | undefined): Promise<void>;
  getUtilitiesList(): Promise<Record<string, string>>;
  getUtilityInfo(utilName: string): Promise<Utility>;
  getActiveUtilityNameByPid(pid: number): Promise<string | null>;
  getActiveUtilityPidByName(utilName: string): Promise<number | null>;
  getActiveUtility(): Promise<{
    name: string | null;
    process: ChildProcess | null;
    pid: number | null;
  }>;
  getNormalizedUtilityName(utilName: string): Promise<string>;
  isUtilityProcessAlive(
    utilName: string | null,
    logging?: boolean
  ): Promise<boolean>;
  reinstallUtility(utilName: string): Promise<void>;
}

export enum LoggerLevelsEnum {
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
  DEBUG = "debug",
  VERBOSE = "verbose",
}

export enum ProcessOutputType {
  STDOUT = "stdout",
  STDERR = "stderr",
}

export enum ProcessPriority {
  REALTIME = "realtime",
  HIGH = "high",
  NORMAL = "normal",
  LOW = "low",
  IDLE = "idle",
}

export interface Utility {
  readonly name: string;
  readonly path: string;
  readonly file: `${string}.exe`;
  readonly meta: {
    readonly links: {
      readonly author: string;
      readonly repo: string;
    };
  };
  readonly runtimeOptions: {
    readonly fallbackLog: boolean;
    readonly fileCheck: {
      readonly onLaunch: boolean;
      readonly onRestart: boolean;
    };
  };
  readonly updateOptions: {
    readonly refBranch: string;
    readonly hooks: {
      readonly preHooks: Array<() => Promise<void> | void>;
      readonly postHooks: Array<() => Promise<void> | void>;
    };
    readonly downloadReleaseOnUpdate: boolean;
    readonly downloadFiles: {
      readonly include: PathLike[];
      readonly exclude: PathLike[];
    };
    readonly backupBeforeUpdate: boolean;
    readonly skipUpdateOnRunning: boolean;
    readonly forceUpdate: boolean;
    readonly preserveConfig: boolean;
  };
}

export interface ReplaceSysFolderOptions {
  separator?: string;
}

export interface ReplaceSysFolderMapping {
  longName: string;
  shortName: string;
}
