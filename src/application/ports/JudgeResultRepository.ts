import { definePort } from "./registry";

/**
 * 判题结果回写相关的数据访问。
 * 实现：infrastructure/persistence/submission/MySqlJudgeResultRepository。
 */
export interface JudgeResultRepository {
	updateSolutionResult(time: any, memory: any, result: any, passPoint: any, passRate: any, judger: any, solutionId: any): Promise<unknown>;
	/** 返回 administrator 权限行（读缓存） */
	findAdministratorPrivilege(userId: string): Promise<any[]>;
	upsertSim(solutionId: any, simSolutionId: any, sim: any): Promise<unknown>;
	deleteCompileInfo(solutionId: any): Promise<unknown>;
	insertCompileInfo(solutionId: any, info: any): Promise<unknown>;
	deleteRuntimeInfo(solutionId: any): Promise<unknown>;
	insertRuntimeInfo(solutionId: any, info: any): Promise<unknown>;
	/** solution 表整行，不存在时为 null */
	getSolutionInfo(solutionId: number): Promise<any | null>;
	/** 返回 [{contest_id}] */
	findContestIdBySolution(solutionId: number | string): Promise<any[]>;
	updateUserSolved(userId: string): Promise<unknown>;
	updateUserSubmit(userId: string): Promise<unknown>;
	updateProblemAccepted(problemId: number | string): Promise<unknown>;
	updateProblemSubmit(problemId: number | string): Promise<unknown>;
}

export const judgeResultRepository = definePort<JudgeResultRepository>("JudgeResultRepository");
