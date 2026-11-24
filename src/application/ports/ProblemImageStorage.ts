import { definePort } from "./registry";

export interface ProblemImage {
	name: string;
	data: string;
}

/**
 * 题面图片（website.dir/images/<题号>/<类型>）。
 * 实现：infrastructure/storage/FsProblemImageStorage
 */
export interface ProblemImageStorage {
	/** 把 data URI 存成图片文件；目录不存在时创建，图片数据不合法时只记录日志 */
	saveImage(problemId: any, type: any, key: any, dataUri: any): Promise<void>;
	/** 读出某类图片（目录不存在时创建并返回空列表） */
	readImages(problemId: any, type: any): Promise<ProblemImage[]>;
}

export const problemImageStorage = definePort<ProblemImageStorage>("ProblemImageStorage");
