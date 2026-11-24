import { definePort } from "./registry";

/** 已上传到临时目录、待放入题目数据目录的文件 */
export interface UploadedProblemFile {
	originalname: string;
	path: string;
}

/**
 * 题目测试数据目录（judger.oj_home/data/<题号>）的文件操作。
 * 实现：infrastructure/storage/ProblemFileManager
 */
export interface ProblemDataStorage {
	getProblemPath(problemId: string | number): string;
	getFilePath(problemId: string | number, fileName: string): string;
	/** 把上传的文件拷进题目数据目录（目录不存在时创建） */
	setSingleFile(problemId: string, file: UploadedProblemFile): Promise<void>;
	/** 确保题目数据目录存在（每个题号只做一次） */
	touchFolder(problemId: string): Promise<void>;
	removeFile(problemId: string, fileName: string): Promise<void>;
	listFiles(problemId: string | number): Promise<string[]>;
}

export const problemDataStorage = definePort<ProblemDataStorage>("ProblemDataStorage");
