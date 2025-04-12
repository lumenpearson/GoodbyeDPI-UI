import { Logger } from "@index";
import * as Sentry from "@sentry/node";
import { FSFileService } from "@services";
import {
  GITHUB_SKIP_FILES,
  type IFSFileService,
  type IGithubFile,
  type IGithubRelease,
  // type IGithubService,
  type Utility,
} from "@shared";
import { env } from "@utils";
import axios, { AxiosResponse } from "axios";
import path from "path";

// export class GithubService implements IGithubService {
export class GithubService {
  private fileService: IFSFileService;
  private downloadReleaseFromGithubHeaders: { [key: string]: string } = {};
  private downloadFilesFromGithubHeaders: { [key: string]: string } = {};

  constructor(fileService: IFSFileService = new FSFileService()) {
    try {
      this.fileService = fileService;
      this.downloadReleaseFromGithubHeaders = {
        "User-Agent": "node.js",
        Authorization: `token ${env.GITHUB_TOKEN}`,
      };
      this.downloadFilesFromGithubHeaders = {
        Accept: "application/vnd.github.v3.raw",
      };
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

  public async getLatestRelease<T = IGithubRelease>(
    apiUrl: string
  ): Promise<T> {
    Logger.info(`Requesting latest release data from URL: ${apiUrl}`);
    try {
      const response = await axios.get<T>(apiUrl, {
        headers: { "User-Agent": "node.js" },
        timeout: 3000,
      });
      Logger.info(
        `Successfully received response from GitHub API for URL: ${apiUrl}`
      );
      return response.data;
    } catch (error: unknown) {
      let errorMessage = "Unknown error occurred during the request.";
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const statusText = error.response?.statusText;
        errorMessage = `GitHub API request error: ${status} ${statusText || error.message}`;
      }
      Logger.error(errorMessage);
      Sentry.captureException(error);
      throw new Error(errorMessage);
    }
  }

  public async checkResponse(
    url: string,
    headers: Record<string, string> = {}
  ): Promise<AxiosResponse> {
    try {
      const response = await axios.get(url, { headers });
      return response;
    } catch (_) {
      throw new Error(`Request failed: ${url}`);
    }
  }

  private async downloadFile(
    url: string,
    localFilePath: string,
    headers: Record<string, string> = {},
    retries: number = 3
  ): Promise<void> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await axios.get(url, {
          headers,
          responseType: "arraybuffer",
        });

        if (response.status === 200) {
          await this.fileService.writeFile(localFilePath, response.data);
          return;
        } else {
          Logger.error(
            `Attempt ${attempt}: Failed to download ${url}: HTTP ${response.status}`
          );
        }
      } catch (error) {
        Logger.error(`Attempt ${attempt}: Failed to download ${url}:`, error);
      }

      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
    Logger.error(`Failed to download ${url} after ${retries} attempts.`);
  }

  public async downloadFilesFromGithub(
    utilInfo: Utility,
    remoteDir: string,
    localDir: string
  ): Promise<number | null> {
    const baseUrl = `https://api.github.com/repos/${utilInfo.meta.links.author}/${utilInfo.meta.links.repo}/contents/${remoteDir}?ref=main`;

    try {
      const response = await this.checkResponse(baseUrl);
      if (response.status !== 200) {
        return response.status;
      }

      const files: IGithubFile[] = response.data;
      await this.fileService.mkdir(localDir, { recursive: true });

      const downloadTasks = files
        .map(async (fileInfo: IGithubFile) => {
          if (fileInfo.type !== "file") return null;

          const filename = fileInfo.name;
          if ([".", ".."].includes(filename)) return null;

          const localFilePath = path.join(localDir, filename);
          if (await this.fileService.stat(localFilePath).catch(() => false))
            return null;
          if (
            GITHUB_SKIP_FILES.has(filename) &&
            (await this.fileService.stat(localFilePath).catch(() => false))
          )
            return null;

          return this.downloadFile(
            fileInfo.download_url,
            localFilePath,
            this.downloadFilesFromGithubHeaders
          );
        })
        .filter(Boolean);

      await Promise.allSettled(downloadTasks);
      return 1;
    } catch (error: unknown) {
      Logger.error("Download error:", error);
      return 0;
    }
  }
}
