import { definePort } from "./registry";

/** 后台账号管理。实现：infrastructure/persistence/user/MySqlAdminUserRepository */
export interface AdminUserRepository {
	/** where / order 为空时用默认条件（只列比赛账号、按注册时间倒序）；返回 [列表, 计数行] */
	getUserList(offset: number, limit: number, where?: string, order?: string): Promise<[any, any]>;
	getDefunctRows(userId: string): Promise<any[]>;
	setDefunct(userId: string, defunct: string): Promise<any>;
	getTeamList(): Promise<any>;
	getPrivilegeList(privilegeList: string[]): Promise<any>;
	addPrivilege(userId: string, rightstr: string): Promise<void>;
	removePrivilege(userId: string, rightstr: string): Promise<void>;
}

export const adminUserRepository = definePort<AdminUserRepository>("AdminUserRepository");
