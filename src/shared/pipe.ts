/**
 * Module: pipe.ts
 * Purpose: Provides utility functions for composing synchronous and asynchronous functions.
 *
 * Functions to Add:
 * - Additional utilities for function composition or similar patterns.
 *
 * Functions to Avoid:
 * - Any utilities unrelated to function composition or pipelines.
 */

export const pipe =
  <T>(...fns: ((arg: T) => any)[]) =>
  (arg: T) =>
    fns.reduce((prev, fn) => fn(prev), arg);

export const pipeAsync =
  <T>(...fns: Array<(arg: T) => T | Promise<T>>) =>
  (arg: T): Promise<T> => {
    return fns.reduce<Promise<T>>(
      async (prevPromise, fn) => fn(await prevPromise),
      Promise.resolve(arg)
    );
  };
