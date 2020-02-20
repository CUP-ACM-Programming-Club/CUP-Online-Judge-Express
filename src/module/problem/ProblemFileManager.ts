import fs from "fs";
import path from "path";
import {Request} from "express";
import {ErrorHandlerFactory} from "../../decorator/ErrorHandler";
import {ok} from "../constants/state";

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

    async copyFileToDest(filePath: string, destPath: string) {
        return new Promise((resolve, reject) => {
            fs.copyFile(filePath, destPath, (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        })
    }

    async removeFileFromDest(filePath: string) {
        return new Promise((resolve, reject) => {
            fs.unlink(filePath, (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }

    @ErrorHandlerFactory(ok.okMaker)
    setFileByRequest(req: Request) {
		const originalFileName = req.file.originalname;
		const problemId = req.params.problemId as string;
		const filePath = req.file.path;
		return this.copyFileToDest(filePath, path.join(this.getProblemPath(problemId), originalFileName));
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
