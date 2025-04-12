/**
 * Module: active-utility-meta.ts
 * Purpose: Defines and exports the ActiveUtilityMeta class that encapsulates metadata
 *          for the currently active utility. This module is strictly for data structure
 *          definition and does not contain any business logic.
 *
 * Functions/Types/Enums to Add:
 * - Do not add any logic directly here. Ensure new additions are placed in the appropriate module.
 */

import { Logger } from "@index";
import { ChildProcess } from "child_process";

export class ActiveUtilityMeta {
  private static instance: ActiveUtilityMeta | null = null;
  public name: string | null = null;
  public process: ChildProcess | null = null;
  public pid: number | null = null;

  constructor(
    name: string | null = null,
    proc: ChildProcess | null = null,
    pid: number | null = null
  ) {
    if (ActiveUtilityMeta.instance) {
      Logger.warn(
        `Отмена попытки создания нового экземпляра сингл-тона ${this.constructor.name}.`
      );
      Logger.error(
        `Активный экземпляр ${this.constructor.name} уже существует!`
      );
      return ActiveUtilityMeta.instance;
    }
    ActiveUtilityMeta.instance = this;
    this.name = name;
    this.process = proc;
    this.pid = pid;
    Logger.debug(
      `${this.constructor.name} успешно инициализирован с состоянием по умолчанию: name=${this.name}, pid=${this.pid}.`
    );
  }

  public async reset(): Promise<void> {
    Logger.debug(`Сброс параметров ${this.constructor.name}.`);
    if (this.process) {
      this.process.removeAllListeners();
    }
    this.name = null;
    this.process = null;
    this.pid = null;
  }
}
