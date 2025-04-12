import { Logger, UtilityManager } from "@index";
import { AvailableUtilsEnum } from "@shared/available-utils";

function handleExit(manager: UtilityManager) {
  process.on("SIGINT", async () => {
    try {
      Logger.debug("Получен сигнал завершения работы (SIGINT).");
      await manager.stop();
    } catch {
    } finally {
      process.exit(0);
    }
  });

  process.on("SIGTERM", async () => {
    try {
      Logger.debug("Получен сигнал завершения работы (SIGTERM).");
      await manager.stop();
    } catch {
    } finally {
      process.exit(0);
    }
  });
}

const manager = new UtilityManager();

handleExit(manager);

// const gbdpiDefaultPreset = ``;
// await manager.run(AvailableUtilsEnum.GoodbyeDPI, gbdpiDefaultPreset);

await manager.isUtilityProcessAlive(
  (await manager.getActiveUtility()).name,
  true
);

await manager.reinstallUtility(AvailableUtilsEnum.GoodbyeDPI);

// await manager.isUtilityProcessAlive(
//   (await manager.getActiveUtility()).name,
//   true
// );

// await promiseDelay(2000);

// await manager.stop();

// const zapretDefaultPreset =
//   "--wf-tcp 80,443 --wf-udp 443,50000-50090 --filter-tcp 80,443 --hostlist netrogat.txt --new --filter-udp 443 --hostlist russia-youtubeQ.txt --dpi-desync fake,udplen --dpi-desync-udplen-increment 5 --dpi-desync-fake-quic quic_2.bin --dpi-desync-cutoff n3 --dpi-desync-repeats 2 --new --filter-tcp 443 --hostlist russia-youtubeGV.txt --dpi-desync split --dpi-desync-fooling md5sig,badseq --dpi-desync-fake-tls tls_clienthello_1.bin --dpi-desync-split-tls sni --dpi-desync-repeats 10 --new --filter-tcp 443 --hostlist russia-youtube.txt --dpi-desync fake,split2 --dpi-desync-fooling md5sig --dpi-desync-split-seqovl 2 --dpi-desync-split-pos 2 --dpi-desync-fake-tls tls_clienthello_2.bin --dpi-desync-autottl --new --filter-tcp 80 --hostlist russia-blacklist.txt --dpi-desync fake,split2 --dpi-desync-fooling md5sig --dpi-desync-autottl --new --filter-tcp 443 --hostlist russia-blacklist.txt --hostlist myhostlist.txt --dpi-desync fake,split2 --dpi-desync-fooling md5sig --dpi-desync-split-seqovl 3 --dpi-desync-split-tls sniext --dpi-desync-fake-tls tls_clienthello_2.bin --dpi-desync-autottl --new --filter-tcp 443 --hostlist list-discord.txt --dpi-desync split --dpi-desync-split-pos 5 --dpi-desync-fooling md5sig,badseq --dpi-desync-fake-tls tls_clienthello_1.bin --dpi-desync-repeats 2 --dpi-desync-autottl --dpi-desync-autottl --new --filter-udp 443 --hostlist list-discord.txt --dpi-desync fake,udplen --dpi-desync-udplen-increment 5 --dpi-desync-udplen-pattern 0xDEADBEEF --dpi-desync-fake-quic quic_2.bin --dpi-desync-repeats 7 --dpi-desync-cutoff n2 --new --filter-udp 50000-50090 --dpi-desync fake --dpi-desync-any-protocol --dpi-desync-cutoff n3 --new --filter-tcp 443 --hostlist-auto autohostlist.txt --hostlist-exclude netrogat.txt --dpi-desync split --dpi-desync-split-pos 1 --dpi-desync-fooling md5sig,badseq --dpi-desync-repeats 10 --dpi-desync-autottl";
// await manager.run("zapret", zapretDefaultPreset);
