import { definePort } from "./registry";

/** 题目实体：get() 取出字段（与 ORM 实例一致，返回的是缓存里的共享对象） */
export interface ProblemInfoRecord {
	get(): any;
}

/**
 * 按题号读取题目（带进程内缓存）。
 * 实现：infrastructure/persistence/problem/OrmProblemInfoStore（包装 ProblemInfoManager）
 */
export interface ProblemInfoStore {
	/** 查不到或出错时返回 null */
	find(problemId: any): Promise<ProblemInfoRecord | null>;
	removeCache(problemId: any): void;
}

export const problemInfoStore = definePort<ProblemInfoStore>("ProblemInfoStore");
