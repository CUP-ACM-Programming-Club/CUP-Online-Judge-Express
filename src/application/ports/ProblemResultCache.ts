import { definePort } from "./registry";

/** 题目模块的结果缓存（搜索结果、源码查看）。实现：infrastructure/cache/NodeProblemResultCache */
export interface ProblemResultCache {
	get(key: string): any;
	set(key: string, value: any, ttlSeconds: number): void;
}

export const problemResultCache = definePort<ProblemResultCache>("ProblemResultCache");
