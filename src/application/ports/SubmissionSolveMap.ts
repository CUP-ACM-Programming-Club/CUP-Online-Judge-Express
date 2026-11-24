import { definePort } from "./registry";

/** 做题关系图（用户 AC 序列 → 题目之间的边），带缓存。实现：infrastructure/persistence/SolveMap/SolveMapManager。 */
export interface SubmissionSolveMap {
	getUserListForRouter(): Promise<any>;
	getTotalACList(): Promise<any>;
	getUserACList(userId: string): Promise<any>;
	getSolveMap(problemId?: number | string): Promise<any>;
}

export const submissionSolveMap = definePort<SubmissionSolveMap>("SubmissionSolveMap");
