import { definePort } from "./registry";

/**
 * 题目创建/修改/导入时的写库操作。
 * 实现：infrastructure/persistence/problem/MySqlProblemManageRepository
 */
export interface ProblemManageRepository {
	/** problemId 为 undefined 时自增，返回 insert 结果（含 insertId） */
	insertProblem(problemId: number | undefined, sqlValues: any[]): Promise<any>;
	deleteProblemPrivilege(problemId: any): Promise<unknown>;
	insertProblemPrivilege(userId: any, problemId: any): Promise<unknown>;
	insertPrefile(problemId: number, prepend: number, code: string, language: number): Promise<unknown>;
	/** 返回 insert 结果（含 insertId） */
	insertStandardSolution(problemId: number, language: number, userId: any, codeLength: number): Promise<any>;
	insertSourceCode(solutionId: any, source: string): Promise<unknown>;
	insertSourceCodeUser(solutionId: any, source: string): Promise<unknown>;
	findMaxProblemIdRows(): Promise<any[]>;
	/** local 为 true 时更新 problem（含 hint/spj），否则更新 vjudge_problem（按 source 过滤） */
	updateProblem(local: boolean, problemId: number, source: string, fields: ProblemUpdateFields): Promise<unknown>;
}

export interface ProblemUpdateFields {
	title: any;
	time: any;
	memory: any;
	description: any;
	input: any;
	output: any;
	sampleinput: any;
	sampleoutput: any;
	label: any;
	hint: any;
	spj: any;
}

export const problemManageRepository = definePort<ProblemManageRepository>("ProblemManageRepository");
