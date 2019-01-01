const cache_query = require("../module/mysql_cache");
module.exports = async (req, res, next) => {
	if (req.session.isadmin) {
		return next();
	}
	const result = await cache_query("select value from global_setting where label = 'contest'");
	global.contest_mode = !!(result && parseInt(result[0].value));
	return next();
};
