import path from "path";
import fs from "fs";
const config = global.config;

/**
 * 判题机编译参数文件的读写，实现 application 的 CompileArgumentsStore 端口。
 * 参数校验在 application/submission/CompileArgumentsUseCases，HTTP 包装在 interfaces/http/controllers/CompilerController。
 */
class CompilerManager {
    async getCompileArguments () {
        return await new Promise((resolve, reject) => {
            fs.readFile(config.etc.compile_arguments, "utf-8", (err, data) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(JSON.parse(data));
                }
            });
        })
    }

    async updateCompileArguments (payload: any) {
        return await new Promise((resolve, reject) => {
            fs.writeFile(config.etc.compile_arguments, JSON.stringify(payload), (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(null);
                }
            })
        })
    }
}

export default new CompilerManager();
