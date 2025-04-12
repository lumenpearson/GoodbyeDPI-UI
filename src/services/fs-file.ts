import type { IFSFileService } from "@shared";
import { Abortable } from "events";
import {
  BigIntStats,
  existsSync,
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
import {
  access,
  FileHandle,
  mkdir,
  rm,
  rmdir,
  stat,
  unlink,
  writeFile,
} from "fs/promises";
import { Stream } from "stream";

export class FSFileService implements IFSFileService {
  /**
   * Returns `true` if the path exists, `false` otherwise.
   *
   * For detailed information, see the documentation of the asynchronous version of
   * this API: {@link exists}.
   *
   * `fs.exists()` is deprecated, but `fs.existsSync()` is not. The `callback` parameter to `fs.exists()` accepts parameters that are inconsistent with other
   * Node.js callbacks. `fs.existsSync()` does not use a callback.
   *
   * ```js
   * import { existsSync } from 'node:fs';
   *
   * if (existsSync('/etc/passwd'))
   *   console.log('The path exists.');
   * ```
   * @since v0.1.21
   */
  public async exists(path: PathLike): Promise<boolean> {
    return existsSync(path);
  }
  /**
   * Tests a user's permissions for the file or directory specified by `path`.
   * The `mode` argument is an optional integer that specifies the accessibility
   * checks to be performed. `mode` should be either the value `fs.constants.F_OK` or a mask consisting of the bitwise OR of any of `fs.constants.R_OK`, `fs.constants.W_OK`, and `fs.constants.X_OK`
   * (e.g.`fs.constants.W_OK | fs.constants.R_OK`). Check `File access constants` for
   * possible values of `mode`.
   *
   * If the accessibility check is successful, the promise is fulfilled with no
   * value. If any of the accessibility checks fail, the promise is rejected
   * with an [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error) object. The following example checks if the file`/etc/passwd` can be read and
   * written by the current process.
   *
   * ```js
   * import { access, constants } from 'node:fs/promises';
   *
   * try {
   *   await access('/etc/passwd', constants.R_OK | constants.W_OK);
   *   console.log('can access');
   * } catch {
   *   console.error('cannot access');
   * }
   * ```
   *
   * Using `fsPromises.access()` to check for the accessibility of a file before
   * calling `fsPromises.open()` is not recommended. Doing so introduces a race
   * condition, since other processes may change the file's state between the two
   * calls. Instead, user code should open/read/write the file directly and handle
   * the error raised if the file is not accessible.
   * @since v10.0.0
   * @param [mode=fs.constants.F_OK]
   * @return Fulfills with `undefined` upon success.
   */
  public async access(path: PathLike, mode?: number): Promise<void> {
    await access(path, mode);
  }
  /**
   * Asynchronous mkdir(2) - create a directory.
   * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
   * @param options Either the file mode, or an object optionally specifying the file mode and whether parent folders
   * should be created. If a string is passed, it is parsed as an octal integer. If not specified, defaults to `0o777`.
   */
  public async mkdir(
    path: PathLike,
    options?: Mode | MakeDirectoryOptions | null
  ): Promise<string | undefined> {
    return await mkdir(path, options);
  }
  /**
   * @since v10.0.0
   * @return Fulfills with the {fs.Stats} object for the given `path`.
   */
  public async stat(
    path: PathLike,
    opts?: StatOptions
  ): Promise<Stats | BigIntStats> {
    return await stat(path, opts);
  }
  /**
   * Removes the directory identified by `path`.
   *
   * Using `fsPromises.rmdir()` on a file (not a directory) results in the
   * promise being rejected with an `ENOENT` error on Windows and an `ENOTDIR` error on POSIX.
   *
   * To get a behavior similar to the `rm -rf` Unix command, use `fsPromises.rm()` with options `{ recursive: true, force: true }`.
   * @since v10.0.0
   * @return Fulfills with `undefined` upon success.
   */
  public async rmdir(path: PathLike, options?: RmDirOptions): Promise<void> {
    await rmdir(path, options);
  }
  /**
   * Removes files and directories (modeled on the standard POSIX `rm` utility).
   * @since v14.14.0
   * @return Fulfills with `undefined` upon success.
   */
  public async rm(path: PathLike, options?: RmOptions): Promise<void> {
    await rm(path, options);
  }
  /**
   * If `path` refers to a symbolic link, then the link is removed without affecting
   * the file or directory to which that link refers. If the `path` refers to a file
   * path that is not a symbolic link, the file is deleted. See the POSIX [`unlink(2)`](http://man7.org/linux/man-pages/man2/unlink.2.html) documentation for more detail.
   * @since v10.0.0
   * @return Fulfills with `undefined` upon success.
   */
  public async unlink(path: PathLike): Promise<void> {
    await unlink(path);
  }
  /**
   * Asynchronously writes data to a file, replacing the file if it already exists. `data` can be a string, a buffer, an
   * [AsyncIterable](https://tc39.github.io/ecma262/#sec-asynciterable-interface), or an
   * [Iterable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#The_iterable_protocol) object.
   *
   * The `encoding` option is ignored if `data` is a buffer.
   *
   * If `options` is a string, then it specifies the encoding.
   *
   * The `mode` option only affects the newly created file. See `fs.open()` for more details.
   *
   * Any specified `FileHandle` has to support writing.
   *
   * It is unsafe to use `fsPromises.writeFile()` multiple times on the same file
   * without waiting for the promise to be settled.
   *
   * Similarly to `fsPromises.readFile` \- `fsPromises.writeFile` is a convenience
   * method that performs multiple `write` calls internally to write the buffer
   * passed to it. For performance sensitive code consider using `fs.createWriteStream()` or `filehandle.createWriteStream()`.
   *
   * It is possible to use an `AbortSignal` to cancel an `fsPromises.writeFile()`.
   * Cancelation is "best effort", and some amount of data is likely still
   * to be written.
   *
   * ```js
   * import { writeFile } from 'node:fs/promises';
   * import { Buffer } from 'node:buffer';
   *
   * try {
   *   const controller = new AbortController();
   *   const { signal } = controller;
   *   const data = new Uint8Array(Buffer.from('Hello Node.js'));
   *   const promise = writeFile('message.txt', data, { signal });
   *
   *   // Abort the request before the promise settles.
   *   controller.abort();
   *
   *   await promise;
   * } catch (err) {
   *   // When a request is aborted - err is an AbortError
   *   console.error(err);
   * }
   * ```
   *
   * Aborting an ongoing request does not abort individual operating
   * system requests but rather the internal buffering `fs.writeFile` performs.
   * @since v10.0.0
   * @param file filename or `FileHandle`
   * @return Fulfills with `undefined` upon success.
   */
  public async writeFile(
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
          /**
           * If all data is successfully written to the file, and `flush`
           * is `true`, `filehandle.sync()` is used to flush the data.
           * @default false
           */
          flush?: boolean | undefined;
        } & Abortable)
      | BufferEncoding
      | null
  ): Promise<void> {
    await writeFile(file, data, options);
  }
}
