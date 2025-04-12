import { FSFileService } from "./fs-file";
import { GithubService } from "./github";

const gh = new GithubService(new FSFileService());
gh.downloadFilesFromGithub(
  {
    name: "GoodbyeDPI",
    path: "goodbyedpi/x86_64",
    file: "goodbyedpi.exe",
    meta: {
      links: { author: "ValdikSS", repo: "goodbyeDPI" },
    },
    runtimeOptions: {
      fallbackLog: false,
      fileCheck: {
        onLaunch: true,
        onRestart: true,
      },
    },
    updateOptions: {
      refBranch: "main",
      hooks: {
        preHooks: [],
        postHooks: [],
      },
      downloadReleaseOnUpdate: true,
      downloadFiles: {
        include: [],
        exclude: [],
      },
      backupBeforeUpdate: true,
      skipUpdateOnRunning: true,
      forceUpdate: false,
      preserveConfig: true,
    },
  },
  "",
  ""
);
