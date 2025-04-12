import { formatProcessOutput, Logger, stopDriverManually } from "@index";
import * as Sentry from "@sentry/node";
import {
  __utilitiesPath,
  ActiveUtilityMeta,
  availableUtils,
  defaultPreset,
  IUtilityManager,
  ProcessOutputType,
  Utility,
} from "@shared";
import {
  checkFileExists,
  clearString,
  replaceSysFoldersWithShortNames,
} from "@utils";
import { UtilityReinstaller } from "@workers";
import { ChildProcess, spawn } from "child_process";
import path from "path";

export class UtilityManager implements IUtilityManager {
  private static instance: UtilityManager | null = null;
  private activeUtilityMeta: ActiveUtilityMeta = new ActiveUtilityMeta();
  private utilities: Record<string, string> = {};
  private utilsPath: string = __utilitiesPath;

  constructor(utilsPath: string | null = null) {
    if (UtilityManager.instance) {
      Logger.warn(
        `Отмена попытки создания нового экземпляра сингл-тона ${this.constructor.name}.`
      );
      Logger.error(
        `Активный экземпляр ${this.constructor.name} уже существует!`
      );
      return UtilityManager.instance;
    }
    this.utilsPath = replaceSysFoldersWithShortNames(
      utilsPath || __utilitiesPath
    );
    this._loadUtilities();
    UtilityManager.instance = this;
    Logger.debug(
      `${this.constructor.name} вызван ${
        utilsPath
          ? `с параметром utilsPath: ${utilsPath}`
          : "без параметров. Используется __utilitiesPath."
      }`
    );
    Logger.debug(`${this.constructor.name} успешно инициализирован.`);
  }

  public async stop(
    utilName: string | null = null,
    pid: number | null = null
  ): Promise<boolean> {
    const _utilName =
      (utilName && (await this.getNormalizedUtilityName(utilName))) ??
      this.activeUtilityMeta.name;
    const _pid = pid || this.activeUtilityMeta.pid;

    if (
      !_utilName ||
      !this.activeUtilityMeta.name ||
      !this.activeUtilityMeta.process ||
      !_pid
    ) {
      Logger.warn("Нет активной утилиты для остановки.");
      return false;
    }

    if (_pid) {
      const result = process.kill(_pid, "SIGTERM");
      if (result) {
        Logger.info(
          `Активный процесс утилиты ${_utilName || ""} с PID ${_pid} успешно остановлен.`
        );
        this._resetActiveUtilityMeta();
        return true;
      }
      Logger.warn(
        `Не удалось остановить процесс утилиты ${_utilName || ""} с PID ${_pid}. Попытка остановки по имени утилиты/активному процессу.`
      );
    }

    Logger.debug(
      `Остановка активной утилиты ${_utilName} (PID: ${
        this.activeUtilityMeta.pid || undefined
      })...`
    );

    this.activeUtilityMeta.process.kill("SIGTERM");

    return new Promise((resolve) => {
      this.activeUtilityMeta.process?.on("close", (code) => {
        if (code === 0 || code === null) {
          Logger.info(
            `Активная утилита ${this.activeUtilityMeta.name} остановлена.`
          );
          this._resetActiveUtilityMeta();
          resolve(true);
        } else {
          const errorMessage = `Ошибка при остановке утилиты (код ${code}).`;
          Logger.error(errorMessage);
          Sentry.captureException(new Error(errorMessage));
          resolve(false);
        }
      });

      this.activeUtilityMeta.process?.on("error", (err: Error) => {
        const errorMessage = `Ошибка остановки утилиты ${err.message}`;
        Logger.error(errorMessage);
        Sentry.captureException(new Error(errorMessage));
        resolve(false);
      });
    });
  }

  public async run(
    utilName: string,
    args: string | null | undefined = ""
  ): Promise<void> {
    try {
      const _utilName = await this.getNormalizedUtilityName(utilName);
      const _args = (typeof args === "string" ? args : defaultPreset)
        .split(" ")
        .map(clearString)
        .filter(Boolean);

      if (
        await this.isUtilityProcessAlive(this.activeUtilityMeta.name, false)
      ) {
        Logger.warn(
          `Утилита ${this.activeUtilityMeta.name} уже запущена. Выполняется остановка...`
        );

        const isPreviousProcessStoped = await this.stop(
          this.activeUtilityMeta.name
        );

        if (!isPreviousProcessStoped) {
          Logger.warn(
            `Не удалось остановить активную утилиту. Принудительная остановка...`
          );
          Logger.info("Выполняется принудительная остановка драйвера...");
          await stopDriverManually();
          return;
        }
      }

      const utilPath = this.utilities[_utilName.toLowerCase()];
      if (!utilPath || !(await checkFileExists(utilPath))) {
        Logger.warn(
          `Файл утилиты ${_utilName} отсутствует. Выполняется переустановка...`
        );
        await this.reinstallUtility(_utilName);
        return;
      }

      const argString =
        _args.length > 0
          ? `с аргументами: ${_args.join(" ")}`
          : "без аргументов.";
      Logger.info(clearString(`Запуск утилиты ${_utilName} ${argString}`));

      const subprocess = await this._spawnUtility(utilPath, _args);
      await this._handleUtilityProcessIO(subprocess, _utilName);

      this.activeUtilityMeta.name = _utilName;
      this.activeUtilityMeta.process = subprocess;
      this.activeUtilityMeta.pid =
        subprocess.pid !== undefined ? subprocess.pid : null;
    } catch (error) {
      const errorMessage = `Ошибка при запуске утилиты "${utilName}": ${error instanceof Error ? error.message : error}`;
      Logger.error(errorMessage);
      Sentry.captureException(new Error(errorMessage));
    }
  }

  public async getUtilitiesList(): Promise<Record<string, string>> {
    return this.utilities;
  }

  public async getUtilityInfo(utilName: string): Promise<Utility> {
    const utilInfo = availableUtils.find(
      (util) => util.name.toLowerCase() === utilName.toLowerCase()
    );
    if (!utilInfo) {
      throw new Error(
        `Утилита с именем "${utilName}" не найдена в списке availableUtils.`
      );
    }
    return utilInfo;
  }

  public async getActiveUtilityNameByPid(pid: number): Promise<string | null> {
    const activeUtility = await this.getActiveUtility();
    if (activeUtility.pid === pid) {
      return activeUtility.name;
    }
    return null;
  }

  public async getActiveUtilityPidByName(
    utilName: string
  ): Promise<number | null> {
    const activeUtility = await this.getActiveUtility();
    if (activeUtility.name === utilName) {
      return activeUtility.pid;
    }
    return null;
  }

  public async getActiveUtility(): Promise<{
    name: string | null;
    process: ChildProcess | null;
    pid: number | null;
  }> {
    return {
      name: this.activeUtilityMeta.name,
      process: this.activeUtilityMeta.process,
      pid: this.activeUtilityMeta.pid,
    };
  }

  public async getNormalizedUtilityName(utilName: string): Promise<string> {
    const utility = availableUtils.find(
      (util) => util.name.toLowerCase() === utilName.toLowerCase()
    );

    if (!utility) {
      const errorMessage = `Утилита с названием "${utilName}" не найдена.`;
      Logger.warn(errorMessage);
      return utilName;
    }

    return utility.name;
  }

  public async isUtilityProcessAlive(
    utilName: string | null = null,
    logging: boolean = false
  ): Promise<boolean> {
    const _logging = logging ?? false;

    const _utilName =
      utilName === null ? this.activeUtilityMeta.name : utilName;

    const isProcessRunning =
      !!this.activeUtilityMeta.process &&
      !this.activeUtilityMeta.process.killed;

    if (_logging && isProcessRunning) {
      const logMessage =
        _utilName === this.activeUtilityMeta.name
          ? `Утилита ${this.activeUtilityMeta.name} активна.`
          : `Утилита ${this.activeUtilityMeta.name} уже запущена вместо ${_utilName}.`;
      _utilName === this.activeUtilityMeta.name
        ? Logger.info(logMessage)
        : Logger.warn(logMessage);
    } else if (_logging && !isProcessRunning) {
      Logger.info(`Нет активной утилиты.`);
    }

    return isProcessRunning && _utilName === this.activeUtilityMeta.name;
  }

  public async reinstallUtility(
    utilName: string,
    launchAfterReinstall: boolean = false
  ): Promise<void> {
    const _utilName = await this.getNormalizedUtilityName(utilName);
    const utilPath = this.utilities[_utilName.toLowerCase()];

    if (!utilPath) {
      Logger.warn(`Утилита ${_utilName} не найдена для переустановки.`);
    }

    if (await this.isUtilityProcessAlive(_utilName)) {
      setTimeout(() => {}, 100);
      Logger.info(
        `Утилита ${utilName} уже запущена. Останавливаем утилиту перед переустановкой...`
      );
      await this.stop(_utilName);
      Logger.info(`Утилита ${utilName} успешно остановлена.`);
    }

    const reinstaller = new UtilityReinstaller(__utilitiesPath, this);
    if (await reinstaller.reinstallUtilityFromGitHub(_utilName)) {
      if (!launchAfterReinstall) {
        Logger.info(
          `Утилита ${utilName} успешно переустановлена, запуск не требуется.`
        );
      } else {
        this._spawnUtility(utilPath, []);
        Logger.info(
          `Утилита ${utilName} успешно запущена после переустановки.`
        );
      }
    }
  }

  private async _resetActiveUtilityMeta(): Promise<void> {
    this.activeUtilityMeta.reset();
  }

  private async _spawnUtility(
    _path: string,
    args: string[]
  ): Promise<ChildProcess> {
    Logger.debug(`Запуск команды: "${_path}" ${args.join(" ")}`);
    return spawn(_path, args, {
      cwd: path.dirname(_path),
      stdio: "inherit",
    });
  }

  private async _handleUtilityProcessIO(
    process: ChildProcess,
    utilName: string
  ): Promise<void> {
    const _utilName = await this.getNormalizedUtilityName(utilName);

    process.stdout?.on("data", (data: Buffer) =>
      formatProcessOutput(data, ProcessOutputType.STDOUT)
    );

    process.stderr?.on("data", (data: Buffer) =>
      formatProcessOutput(data, ProcessOutputType.STDERR)
    );

    process.on("close", (code: number) => {
      Logger.info(`Утилита ${_utilName} завершилась с кодом ${code || 0}.`);
    });

    process.on("error", (err: Error) => {
      Logger.error(`Ошибка запуска утилиты ${_utilName}: ${err.message}`);
      Logger.error(err.stack);
      Sentry.captureException(new Error(err.stack));
    });
  }

  private async _loadUtilities(): Promise<void> {
    for (const util of availableUtils) {
      const resolvedUtilityPath = path.resolve(
        this.utilsPath,
        util.path,
        util.file
      );
      const shortNamePath =
        replaceSysFoldersWithShortNames(resolvedUtilityPath);

      this.utilities[util.name.toLowerCase()] = shortNamePath;

      Logger.info(`Определение утилиты ${util.name} завершено.`);
      Logger.debug(
        `${util.name}:\n${JSON.stringify(
          {
            name: util.name,
            path: util.path,
            file: util.file,
            meta: util.meta,
            runtimeOptions: util.runtimeOptions,
            updateOptions: util.updateOptions,
          },
          null,
          2
        )}`
      );
    }
  }
}
