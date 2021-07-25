import fs from "fs";
import path from "path";
import {Request} from "express";
import {ErrorHandlerFactory} from "../../decorator/ErrorHandler";
import {ok} from "../constants/state";
import CreateFolderIfNotExists from "../../decorator/filesystem/method/CreateFolderIfNotExists";
import Folder from "../../decorator/filesystem/parameter/Folder";
import createFolderIfNotExists from "../util/filesystem/createFolderIfNotExists";
import RunOnceEachKeyAsync from "../../decorator/RunOnceEachKeyAsync";

const D2UConverter = require("dos2unix").dos2unix;
const d2u = new D2UConverter({ glob: { cwd: __dirname } })
    .on("error", function(err: any) {
        console.error(err);
    })
    .on("end", function(stats: any) {
        console.log(stats);
    });
class ProblemFileManager {
    constructor() {
    }

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
        d2u.process([`${destPath}/*`]);
    }

    async removeFileFromDest(filePath: string) {
        await fs.promises.unlink(filePath);
    }

    @ErrorHandlerFactory(ok.okMaker)
    async setFileByRequest(req: Request) {
		const problemId = req.params.problemId as string;
		return await this.setSingleFile(problemId, req.file!);
    }

    async setSingleFile(problemId: string, file: Express.Multer.File) {
        const originalFileName = file.originalname;
        const filePath = file.path;
        return await this.copyFileToDest(filePath, path.join(this.getProblemPath(problemId), originalFileName));
    }

    @RunOnceEachKeyAsync
    async touchFolder(problemId: string) {
        await createFolderIfNotExists(this.getProblemPath(problemId));
    }

    @ErrorHandlerFactory(ok.okMaker)
    async setMultipleFileByRequest(req: Request) {
        const files = req.files as unknown as Express.Multer.File[];
        const result = [];
        for(const file of files) {
            const problemId = req.params.problemId as string;
            await this.touchFolder(problemId);
            result.push(this.setSingleFile(problemId, file));
        }
        return await Promise.all(result);
    }

    @ErrorHandlerFactory(ok.okMaker)
    async removeFileByRequest(req: Request) {
        const fileName = req.params.fileName;
        const problemId = req.params.problemId;
        const filePath = path.join(this.getProblemPath(problemId), fileName);
        return await this.removeFileFromDest(filePath);
    }
}

export default new ProblemFileManager();
