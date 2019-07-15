const query = require("../mysql_query");

function Setting() {
}

Setting.prototype.getSetting = async function (label = []) {
	if (label.length === 0) {
		return await query("select * from global_setting");
	} else {
		return await query(`select * from global_setting where label in (${label.join(",")})`);
	}
};

Setting.prototype.setSetting = async function (label, value) {
	if (typeof label !== "string" || typeof value !== "string") {
		return false;
	}
	await query("update global_setting set value = ? where label = ?", [value, label]);
	return true;
};

module.exports = Setting;