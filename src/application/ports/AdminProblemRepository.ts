import { definePort } from "./registry";

/** 后台题目列表、上下架。实现：infrastructure/persistence/problem/MySqlAdminProblemRepository */
export interface AdminProblemRepository {
	/** where / orderBy 是调用方给出的 SQL 片段（沿用旧接口） */
	findPage(where: string, orderBy: string, offset: number, limit: number): Promise<any[]>;
	count(where: string, orderBy: string): Promise<any[]>;
	findDefunct(problemId: number): Promise<any[]>;
	setDefunct(problemId: number, defunct: string): Promise<unknown>;
}

export const adminProblemRepository = definePort<AdminProblemRepository>("AdminProblemRepository");
