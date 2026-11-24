import { definePort } from "./registry";

/** 判题机编译参数（配置文件 etc.compile_arguments）。实现：infrastructure/persistence/judge/CompilerManager。 */
export interface CompileArgumentsStore {
	getCompileArguments(): Promise<unknown>;
	updateCompileArguments(payload: any): Promise<unknown>;
}

export const compileArgumentsStore = definePort<CompileArgumentsStore>("SubmissionCompileArgumentsStore");
