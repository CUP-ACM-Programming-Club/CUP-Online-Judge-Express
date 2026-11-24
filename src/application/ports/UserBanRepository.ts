import { definePort } from "./registry";

export interface BanDAO {
	user_id: string,
	bantime: string
}

/** ban_user 表。实现：infrastructure/persistence/user/MySqlUserBanRepository */
export interface UserBanRepository {
	getAll(): Promise<BanDAO[]>;
	get(userId: string): Promise<any>;
	set(userId: string, datetime: string): Promise<void>;
	remove(userId: string): Promise<void>;
	/** 封禁检查用（带 2s 读缓存） */
	getBanTimeRows(userId: string): Promise<any[]>;
}

export const userBanRepository = definePort<UserBanRepository>("UserBanRepository");
