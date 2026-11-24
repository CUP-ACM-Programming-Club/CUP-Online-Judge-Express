/**
 * 导入/新建题目时的判题数据写入与 RPK 读取（从 application/services/ProblemManageService 搬来，行为不变）。
 */
import Bluebird from "bluebird";
import path from "path";
import zlib from "zlib";
import { ProblemImportStorage } from "../../application/ports/ProblemImportStorage";
const fs = Bluebird.promisifyAll(require("fs"));
const rimraf = Bluebird.promisify(require("rimraf"));

/** 判题机进程的 uid/gid */
const JUDGE_UID = 48;
const JUDGE_GID = 48;

export class FsProblemImportStorage implements ProblemImportStorage {
    async resetDataDir(pid: number) {
        const save_path = path.join("/home/judge/data", pid.toString());

        if (fs.existsSync(save_path)) {
            await (rimraf as any)(save_path);
        }
        await (fs as any).mkdirAsync(save_path, 0o755);
        return save_path;
    }

    async writeDataFile(savePath: string, name: string, data: string) {
        await (fs as any).writeFileAsync(path.join(savePath, name), data);
        await (fs as any).chownAsync(path.join(savePath, name), JUDGE_UID, JUDGE_GID);
    }

    async chownDataDir(save_path: string) {
        await (fs as any).chownAsync(save_path, JUDGE_UID, JUDGE_GID);
    }

    async readRpk(filePath: string) {
        const data = await (fs as any).readFileAsync(filePath);
        // @ts-ignore
        return (await Bluebird.promisify(zlib.gunzip as any)(data)).toString();
    }
}
