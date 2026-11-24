import { definePort } from "./registry";

/**
 * 题目查询（题面、标签、搜索、源码查看）的持久化。
 * 实现：infrastructure/persistence/problem/MySqlProblemRepository
 */
export interface ProblemRepository {
	findUploaderRows(problemId: any): Promise<any[]>;
	findRunningContestProblemRows(problemId: any): Promise<any[]>;
	findPrefiles(problemId: any): Promise<any[]>;
	/** 管理员看本地题：带出题人（creator） */
	findLocalProblemWithCreator(problemId: any): Promise<any[]>;
	findLocalProblem(problemId: any): Promise<any[]>;
	findVjudgeProblem(problemId: any, source: string): Promise<any[]>;
	/** 非管理员看 vjudge 题：排除进行中/私有比赛里的题 */
	findPublicVjudgeProblem(problemId: any, source: string): Promise<any[]>;
	/** 题面页附带的提交源码；browsePrivilege 为 false 时只返回自己的或已分享的 */
	findUserSourceCode(solutionId: any, userId: any, browsePrivilege: boolean): Promise<any[]>;
	findSolutionLanguage(solutionId: any): Promise<any[]>;
	searchProblems(likeValue: string, isAdmin: boolean): Promise<any[]>;
	/** vjudge 为 "" 或 "vjudge_" */
	findAllLabels(vjudge: string): Promise<any[]>;
	insertLabelIfAbsent(vjudge: string, label: string): Promise<unknown>;
	findLabelList(vjudge: string): Promise<any[]>;
	findContestEndTimesOfProblem(problemId: any): Promise<any[]>;
	/** prefix 为 "" 或 "vjudge_" */
	findSourceCodeWithOwner(solutionId: number, prefix: string): Promise<any[]>;
}

export const problemRepository = definePort<ProblemRepository>("ProblemRepository");
