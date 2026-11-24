import { definePort } from "./registry";

/**
 * 导入/新建题目时写判题数据（/home/judge/data/<题号>）与读取 RPK 包。
 * 实现：infrastructure/storage/FsProblemImportStorage
 */
export interface ProblemImportStorage {
	/** 清空并重建题目数据目录，返回目录路径 */
	resetDataDir(problemId: number): Promise<string>;
	/** 写入 dir/name 并把属主改成判题用户 */
	writeDataFile(dir: string, name: string, data: string): Promise<void>;
	/** 把目录属主改成判题用户 */
	chownDataDir(dir: string): Promise<void>;
	/** 读取 gzip 压缩的 RPK 包，返回解压后的文本 */
	readRpk(filePath: string): Promise<string>;
}

export const problemImportStorage = definePort<ProblemImportStorage>("ProblemImportStorage");
