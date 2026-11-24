import { definePort } from "./registry";

/**
 * contest 领域读取题目信息用的窄端口（题目归 problem 领域）。
 * 实现：infrastructure/persistence/contest/ContestProblemInfoLookupAdapter（转调 ProblemInfoManager）。
 */
export interface ContestProblemInfoLookup {
	/** 返回 ORM 模型实例（调用方用 .get() 取值） */
	findProblemInfo(problemId: any): Promise<any>;
}

export const contestProblemInfoLookup = definePort<ContestProblemInfoLookup>("ContestProblemInfoLookup");
