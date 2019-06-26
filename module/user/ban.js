const query = require("../mysql_query");

module.exports = function () {
	this.getAll = async function () {
		return await query("select * from ban_user");
	};

	this.get = async function (user_id) {
		return await query("select * from ban_user where user_id = ?", [user_id]);
	};

	this.set = async function (user_id, datetime) {
		await query("INSERT INTO ban_user (user_id, bantime) VALUES(?,?) ON DUPLICATE KEY UPDATE user_id = ?, bantime = ?",
			[user_id, datetime, user_id, datetime]);
	};

	this.remove = async function (user_id) {
		await query("delete from ban_user where user_id = ?", [user_id]);
	};
};