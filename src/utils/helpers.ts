/**
 * Module: helpers.ts
 * Purpose: General-purpose utility functions that don't belong to any specific category.
 *
 * Functions to Add:
 * - Generic helper functions that are reusable across the project.
 *
 * Functions to Avoid:
 * - Project-specific logic or functions that belong to another dedicated module.
 */

export function promiseDelay(ms: number = 1000): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
