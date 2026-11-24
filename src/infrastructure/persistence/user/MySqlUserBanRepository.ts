import { query, cachedQuery, LEGACY_CACHE_TTL_MS } from "../../db";
import { BanDAO, UserBanRepository } from "../../../application/ports/UserBanRepository";

export class MySqlUserBanRepository implements UserBanRepository {
	async getAll() {
		return await query("select bantime, user_id from ban_user") as BanDAO[];
	}

	async get(userId: string) {
		return await query("select * from ban_user where user_id = ?", [userId]);
	}

	async set(userId: string, datetime: string) {
		await query("INSERT INTO ban_user (user_id, bantime) VALUES(?,?) ON DUPLICATE KEY UPDATE user_id = ?, bantime = ?",
			[userId, datetime, userId, datetime]);
	}

	async remove(userId: string) {
		await query("delete from ban_user where user_id = ?", [userId]);
	}

	getBanTimeRows(userId: string): Promise<any[]> {
		return cachedQuery("select bantime from ban_user where user_id = ?", [userId], { ttlMs: LEGACY_CACHE_TTL_MS });
	}
}
