import { definePort } from "./registry";

/** 服务器日志尾部。实现：infrastructure/persistence/system/LogManager（读 pm2 日志文件） */
export interface SystemLog {
	getStdoutLog(line?: number): Promise<string>;
	getStderrLog(line?: number): Promise<string>;
}

/** 服务端版本与依赖（来自 package.json）。实现：infrastructure/persistence/system/VersionManager */
export interface VersionInfo {
	readonly version: string;
	readonly git: string;
	readonly license: string;
	readonly dependencies: Record<string, string>;
	readonly devDependencies: Record<string, string>;
}

export const systemLog = definePort<SystemLog>("SystemLog");
export const versionInfo = definePort<VersionInfo>("VersionInfo");
