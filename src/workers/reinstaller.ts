import { Logger } from "@index";
import { Octokit } from "@octokit/rest";
import * as Sentry from "@sentry/node";
import { FSFileService } from "@services";
import { IFSFileService, IUtilityManager, Utility } from "@shared";
import { env } from "@utils";

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

  public async reinstallUtilityFromGitHub(utilName: string): Promise<void> {
    const normalized =
      await this.utilityManager.getNormalizedUtilityName(utilName);
    try {
    } catch {}
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
}
