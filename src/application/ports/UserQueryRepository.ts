import { definePort } from "./registry";

/** 用户资料页、统计类查询。实现：infrastructure/persistence/user/MySqlUserQueryRepository */
export interface UserQueryRepository {
	/** 资料页的 17 条查询结果，顺序见实现 */
	getProfileRows(userId: string): Promise<any[]>;
	getUserInfoByUserId(userId: string): Promise<any>;
	getUserIdBySolutionId(solutionId: string | number): Promise<any[]>;
	/** fields 已经过白名单过滤 */
	getLoginLogStats(fields: string[]): Promise<any>;
	getUserByNick(nick: string): Promise<any>;
	getRecentRegisteredUsers(): Promise<any>;
	getRegisterTimeline(): Promise<any>;
	/** 提交统计：[提交记录, 代码行数]，参数为 (user_id) 或 (user_id, start, end) */
	getSubmitStatRows(...args: any[]): Promise<[any[], any[]]>;
	getUserConfirmInfo(userId: string): Promise<any>;
}

export const userQueryRepository = definePort<UserQueryRepository>("UserQueryRepository");
