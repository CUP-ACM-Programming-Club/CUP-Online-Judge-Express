import { definePort } from "./registry";

/**
 * 题目提交统计（problemstatus 页）的数据访问与缓存。
 * source=true 统计本地 solution 表，否则 vjudge_solution（ojFrom 非空时按 oj_name 过滤）。
 * 实现：infrastructure/persistence/submission/MySqlSubmissionProblemStatusRepository。
 */
export interface SubmissionProblemStatusRepository {
	/** 合并统计（按 result 分组，附带总数） */
	findMergedStats(problemId: number, userId: string, source: boolean, ojFrom: string): Promise<any[]>;
	/** AC 提交一页（按时间、内存、代码长度排序） */
	findAcceptedSolutions(problemId: number, source: boolean, ojFrom: string, offset: number, pageCnt: number): Promise<any[]>;
	/** 题目所在比赛的最晚结束时间：[{end_time}] */
	findContestEndTime(problemId: number): Promise<any[]>;
	/** [{time_limit, memory_limit}] */
	findProblemLimit(problemId: number): Promise<any[]>;
	/** 用户在该题的 AC 数：[{passed}] */
	findUserPassed(problemId: number, userId: string, source: boolean): Promise<any[]>;
	/** AC 用时分布（按 timeStep 分段） */
	findTimeDistribution(problemId: number, timeLimit: number, timeStep: number): Promise<any[]>;
	/** AC 内存分布（按 memoryStep 分段） */
	findMemoryDistribution(problemId: number, memoryLimit: number, memoryStep: number): Promise<any[]>;

	getCachedStatus(cacheKey: string): Promise<string | null | undefined>;
	setCachedStatus(cacheKey: string, seconds: number, value: string): Promise<unknown>;
	clearCachedStatus(cacheKeys: string[], name: string): Promise<void>;
}

export const submissionProblemStatusRepository = definePort<SubmissionProblemStatusRepository>("SubmissionProblemStatusRepository");
