const cache_query = require("../module/mysql_cache");
const [error] = require("../module/const_var");
const dayjs = require("dayjs");
module.exports = async (req, res, next) => {
	if(typeof next !== "function") {
		return;
	}
	if (req.session && req.session.isadmin) {
		return next();
	} else {
		if (!req.session.auth) {
			res.json(error.nologin);
			return;
		}
		const data = await cache_query("select bantime from ban_user where user_id = ?", [req.session.user_id]);
		if (!data || data.length === 0) {
			return next();
		} else if (dayjs(data[0].bantime).isAfter(dayjs())) {
			res.json(error.errorMaker("You have been banned"));
			req.session.destroy();
		} else {
			return next();
		}
	}
};
