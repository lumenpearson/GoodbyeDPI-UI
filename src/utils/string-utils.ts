/**
 * Module: string-utils.ts
 * Purpose: Provides utilities for manipulating and formatting strings.
 *
 * Functions to Add:
 * - Utilities for string transformations, formatting, or validation.
 *
 * Functions to Avoid:
 * - Logic unrelated to strings, such as file operations or system-level utilities.
 */

import { charMap, pipe } from "@shared";
import { FORMAT } from "@shared/constants";

export const clearString = (str: string): string => {
  const pattern = new RegExp("[\\r\\n]+", "g");
  return str.replace(pattern, "").trim();
};

export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || isNaN(bytes) || bytes <= 0) {
    return `0 ${FORMAT[0]}`;
  }

  const byteKBase = 1024;
  const base = Math.floor(Math.log(bytes) / Math.log(byteKBase));
  const formattedByte = bytes / byteKBase ** base;

  return `${Math.trunc(formattedByte * 10) / 10} ${FORMAT[base]}`;
};

export const removeSymbolsFromName = (name: string) =>
  name.replace(/[^A-Za-z 0-9]/g, "");

export const removeDuplicateSpaces = (name: string) =>
  name.replace(/\s{2,}/g, " ");

export const replaceDotsWithSpace = (name: string) => name.replace(/\./g, " ");

export const replaceUnderscoreWithSpace = (name: string) =>
  name.replace(/_/g, " ");

export const formatName = pipe<string>(
  (str) =>
    str.replace(
      new RegExp(Object.keys(charMap).join("|"), "g"),
      (match) => charMap[match]
    ),
  (str) => str.toLowerCase(),
  replaceUnderscoreWithSpace,
  replaceDotsWithSpace,
  removeSymbolsFromName,
  removeDuplicateSpaces,
  (str) => str.trim()
);
