import path from "path";
import fs from "fs";
import {Request} from "express";
import {ErrorHandlerFactory} from "../../decorator/ErrorHandler";
import {ok} from "../../module/constants/state";
import _ from "lodash";
const config = global.config;

class CompileArgumentValidator {
    validate(payload: any) {
        _.forEach(payload, (value, key) => {
            if (isNaN(parseInt(key)) || !Array.isArray(value)) {
                throw new Error("Invalid compile arguments data.")
            }
        });
    }
}

class CompilerManager {
    validator = new CompileArgumentValidator();
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

    @ErrorHandlerFactory(ok.okMaker)
    async getCompileArgumentsByRequest (req: Request) {
        return await this.getCompileArguments();
    }

    async updateCompileArguments (payload: any) {
        return await new Promise((resolve, reject) => {
            fs.writeFile(config.etc.compile_arguments, JSON.stringify(payload), (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            })
        })
    }

    @ErrorHandlerFactory(ok.okMaker)
    async updateCompileArgumentsByRequest (req: Request) {
        const payload = req.body.payload;
        this.validator.validate(payload);
        return await this.updateCompileArguments(payload);
    }
}

export default new CompilerManager();
