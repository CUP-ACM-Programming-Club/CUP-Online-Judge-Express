const query = require("../mysql_query");

class Ban {
	async getAll() {
		return await query("select * from ban_user");
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
}

module.exports = new Ban();
