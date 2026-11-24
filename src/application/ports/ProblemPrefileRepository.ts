import { definePort } from "./registry";

export interface PrefileRow {
	problem_id: number;
	prepend: number;
	code: string;
	type: number;
}

export interface PrefileCode {
	language: number;
	code: string;
}

/** 题目前置/后置代码（prefile 表）。实现：infrastructure/persistence/problem/MySqlProblemPrefileRepository */
export interface ProblemPrefileRepository {
	/** prepend：1 前置，0 后置 */
	findByProblem(problemId: number | string, prepend: number): Promise<PrefileRow[]>;
	insert(problemId: number | string, prepend: number, code: PrefileCode): Promise<unknown>;
	deleteByProblem(problemId: number | string, prepend: number): Promise<unknown>;
}

export const problemPrefileRepository = definePort<ProblemPrefileRepository>("ProblemPrefileRepository");
