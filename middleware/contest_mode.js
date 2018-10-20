const [error] = require("../module/const_var");
const cache_query = require("../module/mysql_cache");
module.exports = async (req, res, next) => {
	if (global.contest_mode) {
		res.json(error.contestMode);
		const result = cache_query("select value from global_setting where label = 'contest'");
		global.contest_mode = !!(result && result[0].value);
	}
	else {
		return next();
	}
};
