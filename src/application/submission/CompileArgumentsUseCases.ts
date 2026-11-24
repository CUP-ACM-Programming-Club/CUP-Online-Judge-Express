import _ from "lodash";
import { compileArgumentsStore } from "../ports/CompileArgumentsStore";

/** 编译参数：键为语言编号，值为参数数组（原 CompilerManager 的 CompileArgumentValidator） */
class CompileArgumentValidator {
    validate(payload: any) {
        _.forEach(payload, (value, key) => {
            if (isNaN(parseInt(key)) || !Array.isArray(value)) {
                throw new Error("Invalid compile arguments data.")
            }
        });
    }
}

export class CompileArgumentsUseCases {
    validator = new CompileArgumentValidator();

    async getCompileArguments() {
        return await compileArgumentsStore.getCompileArguments();
    }

    async updateCompileArguments(payload: any) {
        this.validator.validate(payload);
        return await compileArgumentsStore.updateCompileArguments(payload);
    }
}

export default new CompileArgumentsUseCases();
