import fs from "fs";
import path from "path";
import CreateFolderIfNotExists from "./decorators/method/CreateFolderIfNotExists";
import Folder from "./decorators/parameter/Folder";
import createFolderIfNotExists from "./filesystem/createFolderIfNotExists";
import RunOnceEachKeyAsync from "../../shared/decorators/RunOnceEachKeyAsync";
import { ProblemDataStorage, UploadedProblemFile } from "../../application/ports/ProblemDataStorage";

const Bluebird = require("bluebird");
const fsAsync = Bluebird.promisifyAll(require("fs"));

/**
 * 题目测试数据目录的文件操作（ProblemDataStorage 的实现）。
 * 从请求取参数、包装返回值的部分在 interfaces/http/controllers/ProblemDataController。
 */
export class ProblemFileManager implements ProblemDataStorage {
    getProblemPath(problemId: string | number) {
        const ojHome = path.join(global.config.judger.oj_home, "data");
        return path.join(ojHome, problemId.toString());
    }

    getFilePath(problemId: string | number, fileName: string) {
        return path.join(this.getProblemPath(problemId), fileName);
    }

    @CreateFolderIfNotExists
    async copyFileToDest(filePath: string, @Folder destPath: string) {
        await fs.promises.copyFile(filePath, destPath);
    }

    async removeFileFromDest(filePath: string) {
        await fs.promises.unlink(filePath);
    }

    async setSingleFile(problemId: string, file: UploadedProblemFile) {
        const originalFileName = file.originalname;
        const filePath = file.path;
        return await this.copyFileToDest(filePath, path.join(this.getProblemPath(problemId), originalFileName));
    }

    @RunOnceEachKeyAsync
    async touchFolder(problemId: string) {
        await createFolderIfNotExists(this.getProblemPath(problemId));
    }

    async removeFile(problemId: string, fileName: string) {
        const filePath = path.join(this.getProblemPath(problemId), fileName);
        return await this.removeFileFromDest(filePath);
    }

    async listFiles(problemId: string | number): Promise<string[]> {
        return await fsAsync.readdirAsync(this.getProblemPath(problemId));
    }
}

export default new ProblemFileManager();
