import { definePort } from "./registry";

/** 时间段排行统计的口径：本地题（solution）或 vjudge（vjudge_solution） */
export type TimeRankKind = "local" | "vjudge";

export interface MemberFilter {
	acm_member?: boolean;
	retired_member?: boolean;
}

/** 排行榜数据访问。实现：infrastructure/persistence/submission/MySqlRanklistRepository。 */
export interface RanklistRepository {
	/** 总榜一页（按 solved / vjudge_accept 排序），member 过滤 acm 队员 / 退役队员 */
	findOverallPage(vjudge: boolean, member: MemberFilter | any, offset: number, pageSize: number): Promise<any[]>;
	/** 按 user_id / nick 模糊搜索一页 */
	searchPage(vjudge: boolean, searchName: string, offset: number, pageSize: number): Promise<any[]>;
	/** 时间段内按用户聚合排序后的一页：[{user_id, solved, has_reserved_key}] */
	findTimeRankPage(kind: TimeRankKind, timeStart: string, offset: number, pageSize: number): Promise<any[]>;
	/** 时间段内按用户聚合排序后的全部结果 */
	findTimeRankAll(kind: TimeRankKind, timeStart: string): Promise<any[]>;
	/** 时间段内是否有 AC：返回 [{any_ac}] 或 [] */
	probeAnyAccepted(kind: TimeRankKind, timeStart: string): Promise<any[]>;
	findUsersByIds(userIds: any[]): Promise<any[]>;
	/** 时间段内 vjudge 提交数：[{user_id, submit}] */
	countVjudgeSubmits(timeStart: string, userIds: any[]): Promise<any[]>;
	countUsers(): Promise<any[]>;
	countAcmMembers(): Promise<any[]>;
}

export const ranklistRepository = definePort<RanklistRepository>("RanklistRepository");
