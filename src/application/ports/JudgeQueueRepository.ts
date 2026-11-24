import { definePort } from "./registry";

/**
 * 判题队列相关的数据访问：未判提交收集、重判、判题机运行时错误标记。
 * 实现：infrastructure/persistence/submission/MySqlJudgeQueueRepository。
 */
export interface JudgeQueueRepository {
	/** 等待判题（result=0）的提交 */
	findWaitingSubmissions(noDataProblemIds: any[], limit: number): Promise<any[]>;
	/** 等待重判（result=1）的提交 */
	findRejudgeSubmissions(noDataProblemIds: any[], limit: number): Promise<any[]>;
	/** 收集器用：用户是否管理员，返回 [{cnt}] */
	countAdministrator(userId: string): Promise<any[]>;
	/** 送判失败：标记为系统错误（result=15） */
	markSubmitFailed(solutionId: number | string): Promise<unknown>;
	/** 判题机运行时致命错误（result=16） */
	markRuntimeFatal(solutionId: any): Promise<unknown>;
	/** 重判：把 idName（solution_id / contest_id / problem_id）= id 的提交重置为等待重判 */
	resetSolutionStatus(idName: string, id: number | string): Promise<unknown>;
	/** 直接设置 idName = id 的提交结果 */
	setSolutionResult(idName: string, id: number | string, result: number | string): Promise<unknown>;
	/** 重判用：取提交者与比赛 */
	findSolutionOwner(solutionId: number): Promise<any[]>;
	/** 重判用：用户是否管理员，返回 [{cnt}] */
	countAdministratorForRejudge(userId: string): Promise<any[]>;
}

export const judgeQueueRepository = definePort<JudgeQueueRepository>("JudgeQueueRepository");
