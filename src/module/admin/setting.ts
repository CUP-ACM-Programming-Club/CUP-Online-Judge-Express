const query = require("../mysql_query");

class Setting {
	async getSetting(label: any = []) {
		if (label.length === 0) {
			return await query("select * from global_setting");
		} else {
			return await query(`select * from global_setting where label in (${label.join(",")})`);
		}
	}

	async setSetting(label: string, value: string) {
		if (typeof label !== "string" || typeof value !== "string") {
			return false;
		}
		await query("update global_setting set value = ? where label = ?", [value, label]);
		return true;
	}
}

module.exports = Setting;