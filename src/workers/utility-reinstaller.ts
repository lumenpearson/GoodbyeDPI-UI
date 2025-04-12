import { Logger } from "@index";
import { Octokit } from "@octokit/rest";
import * as Sentry from "@sentry/node";
import { FSFileService } from "@services";
import { IFSFileService, IUtilityManager, Utility } from "@shared";
import { env } from "@utils";
import axios from "axios";
import extract from "extract-zip";
import { readdir, rename, rm } from "fs/promises";
import path from "path";

export class UtilityReinstaller {
  private utilsPath: string;
  private utilityManager: IUtilityManager;
  private fileService: IFSFileService;

  constructor(
    utilsPath: string,
    utilityManager: IUtilityManager,
    fileService: IFSFileService = new FSFileService()
  ) {
    try {
      this.utilsPath = utilsPath;
      this.utilityManager = utilityManager;
      this.fileService = fileService;
      Logger.debug(`${this.constructor.name} успешно инициализирован.`);
    } catch (error) {
      const errorMessage =
        `Произошла ошибка при инициализации ${this.constructor.name}: ` +
        (error instanceof Error ? error.message : String(error));
      Logger.error(errorMessage);
      Sentry.captureException(error);
      throw new Error(errorMessage);
    }
  }

  public async reinstallUtilityFromGitHub(utilName: string): Promise<boolean> {
    const normalized =
      await this.utilityManager.getNormalizedUtilityName(utilName);
    try {
      Logger.info(
        `Инициирована переустановка утилиты ${normalized} через GitHub.`
      );
      const utilInfo = await this.utilityManager.getUtilityInfo(normalized);
      const mainUtilityPath = path.join(
        this.utilsPath,
        utilInfo.path,
        utilInfo.file
      );

      if (
        (await this.fileService.exists(mainUtilityPath)) &&
        (await this.utilityManager.isUtilityProcessAlive(utilName))
      ) {
        await this.stopUtility(normalized);
      }

      this.checkGithubToken();

      await this.downloadAndExtractAssets(
        await this.fetchLatestRelease(utilInfo.meta),
        await this.prepareUtilityFolder(normalized)
      );
      await this.checkMainUtilityFile(utilInfo);

      return true;
    } catch (error) {
      const errorMessage =
        `Переустановка утилиты ${normalized} завершилась неудачно:\n` +
        (error instanceof Error ? error.message : String(error));
      Logger.error(errorMessage);
      Sentry.captureException(error);
      return false;
    }
  }

  private async stopUtility(utilName: string): Promise<void> {
    const isStopped = await this.utilityManager.stop(utilName, null);
    if (!isStopped) {
      Logger.warn(
        `Не удалось остановить утилиту ${utilName} для переустановки.`
      );
    } else {
      Logger.info(`Утилита ${utilName} успешно остановлена.`);
    }
  }

  private checkGithubToken(): void {
    if (!env.GITHUB_TOKEN) {
      throw new Error(
        "Переменная окружения GITHUB_TOKEN не задана. Необходим токен для авторизации в OctoKit."
      );
    }
  }

  private async fetchLatestRelease(utilInfo: Utility["meta"]): Promise<any> {
    const octokit = new Octokit({ auth: env.GITHUB_TOKEN });
    Logger.info(
      `Запрос данных последнего релиза для ${utilInfo.links.author}/${utilInfo.links.repo}...`
    );
    const releaseResponse = await octokit.repos.getLatestRelease({
      owner: utilInfo.links.author,
      repo: utilInfo.links.repo,
    });
    return releaseResponse.data;
  }

  private async prepareUtilityFolder(utilName: string): Promise<string> {
    const targetFolder = path.resolve(this.utilsPath, utilName.toLowerCase());
    if (!(await this.fileService.exists(targetFolder))) {
      Logger.debug(`Папка ${targetFolder} не найдена. Создание папки...`);
      await this.fileService.mkdir(targetFolder, { recursive: true });
    }
    return targetFolder;
  }

  private async downloadAndExtractAssets(
    releaseData: any,
    preparedUtilFolder: string
  ): Promise<void> {
    for (const asset of releaseData.assets) {
      Logger.info(
        `Скачивание asset: ${asset.name} по URL: ${asset.browser_download_url}.`
      );
      const assetResponse = await axios.get(asset.browser_download_url, {
        headers: {
          "User-Agent": "node.js",
          Authorization: `token ${env.GITHUB_TOKEN}`,
        },
        responseType: "arraybuffer",
        // responseType: "stream",
      });
      const buffer = Buffer.from(assetResponse.data);
      const destinationPath = path.join(preparedUtilFolder, asset.name);

      Logger.error(
        `preparedUtilFolder: ${preparedUtilFolder}\ndestinationPath: ${destinationPath}\nasset.name: ${asset.name}`
      );

      if (await this.fileService.exists(destinationPath)) {
        await this.fileService.unlink(destinationPath);
        Logger.info(`Файл ${asset.name} удалён для обновления.`);
      }

      await this.fileService.writeFile(destinationPath, buffer);
      Logger.info(
        `Файл ${asset.name} успешно скачан и сохранён в ${destinationPath}.`
      );

      if (
        asset.name.toLowerCase().endsWith(".zip") ||
        asset.name.toLowerCase().endsWith(".tar.gz")
      ) {
        await this.extractAndFlattenAsset(
          asset.name,
          destinationPath,
          preparedUtilFolder
        );
      }
    }
  }

  private async extractAndFlattenAsset(
    assetName: string,
    zipPath: string,
    targetFolder: string
  ): Promise<void> {
    Logger.info(`Распаковка архива ${assetName}...`);
    try {
      // 1. Очищаем целевую папку, чтобы не смешивать старые файлы с новыми.
      if (await this.fileService.exists(targetFolder)) {
        await this.fileService.rm(targetFolder, {
          recursive: true,
          force: true,
        });
      }

      // 2. Создаём заново
      await this.fileService.mkdir(targetFolder, { recursive: true });

      // 3. Распаковываем архив сразу в targetFolder.
      await extract(zipPath, { dir: targetFolder });
      Logger.info(`Архив ${assetName} успешно распакован в ${targetFolder}.`);

      // 3. Проверяем, не создалась ли единственная подпапка (например, goodbyedpi-0.2.2).
      const entries = await readdir(targetFolder, { withFileTypes: true });
      const subdirs = entries.filter((entry) => entry.isDirectory());

      // Если в targetFolder ровно один каталог и нет других файлов — переносим всё из него «наверх».
      if (subdirs.length === 1 && entries.length === 1) {
        const extractedFolder = path.join(targetFolder, subdirs[0].name);
        const nestedEntries = await readdir(extractedFolder, {
          withFileTypes: true,
        });

        for (const nestedEntry of nestedEntries) {
          const srcPath = path.join(extractedFolder, nestedEntry.name);
          const destPath = path.join(targetFolder, nestedEntry.name);

          // Если вдруг уже есть файлы с таким же именем, можно удалить/перезаписать.
          if (await this.fileService.exists(destPath)) {
            await this.fileService.rm(destPath, {
              recursive: true,
            });
          }

          await rename(srcPath, destPath);
        }

        // Удаляем пустую подпапку
        await this.fileService.rm(extractedFolder, {
          recursive: true,
          force: true,
        });
      }

      // 4. Удаляем скачанный zip-архив
      if (await this.fileService.exists(zipPath)) {
        await this.fileService.unlink(zipPath);
      }

      Logger.info(
        `Архив ${assetName} распакован и вычищен без дополнительных подпапок.`
      );
    } catch (err) {
      const errMsg = `Ошибка при распаковке архива ${assetName}: ${
        err instanceof Error ? err.message : String(err)
      }`;
      Logger.error(errMsg);
      throw new Error(errMsg);
    }
  }

  private async flattenExtractedFolder(
    srcDir: string,
    destDir: string,
    levels: number = 0
  ): Promise<void> {
    let currentDir = srcDir;
    for (let i = 0; i < levels; i++) {
      const entries = await readdir(currentDir, { withFileTypes: true });
      const subdirs = entries.filter((entry) => entry.isDirectory());
      if (subdirs.length === 1) {
        currentDir = path.join(currentDir, subdirs[0].name);
      } else {
        break;
      }
    }
    const entries = await readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(currentDir, entry.name);
      const destPath = path.join(destDir, entry.name);
      await rename(srcPath, destPath);
    }
    await rm(srcDir, { recursive: true, force: true });
  }

  private async checkMainUtilityFile(utilInfo: Utility): Promise<void> {
    const mainUtilityPath = path.join(
      this.utilsPath,
      utilInfo.path,
      utilInfo.file
    );
    if (!this.fileService.exists(mainUtilityPath)) {
      throw new Error(
        `Основной файл утилиты (${utilInfo.file}) не найден после скачивания и распаковки релиза.`
      );
    }
  }
}
