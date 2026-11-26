import { definePort } from "./registry";

export interface StatusQueryOptions {
	problem_id?: number | { type: number, value: number }[];
	user_id?: string;
	language?: number;
	result?: number;
	contest_id?: number;
	sim?: boolean;
	num?: number;
	limit?: number;
}

/**
 * 状态页列表查询的三种口径：
 * - privileged：有查看源码权限（管理员 / source_browser / 比赛助教），看全部字段
 * - contest：比赛内的普通用户
 * - global：全站状态页的普通用户
 */
export type StatusListScope = "privileged" | "contest" | "global";

/** 状态页数据访问。实现：infrastructure/persistence/submission/MySqlSubmissionStatusRepository。 */
export interface SubmissionStatusRepository {
	/** 按筛选条件取一页（20 条）提交，筛选条件到 SQL 的转换在实现里 */
	findStatusPage(scope: StatusListScope, requestQuery: StatusQueryOptions, limit: number, viewerId?: string): Promise<any[]>;
	/** 比赛是否已结束：返回 [{cnt}] */
	findContestEnded(contestId: number): Promise<any[]>;
	/** 批量取用户信息（user_id IN (?)） */
	findUsersByIds(userIds: any[]): Promise<any[]>;
	/** 逐个取用户信息（user_id = ?，按 MySQL 排序规则比较） */
	findUserInfo(userId: any): Promise<any[]>;
	findContest(contestId: number): Promise<any[]>;
}

export const submissionStatusRepository = definePort<SubmissionStatusRepository>("SubmissionStatusRepository");
