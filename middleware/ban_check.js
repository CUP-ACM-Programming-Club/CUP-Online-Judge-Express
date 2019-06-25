const cache_query = require("../module/mysql_cache");
const [error] = require("../module/const_var");
const dayjs = require("dayjs");
module.exports = async (req, res, next) => {
	if (req.session && req.session.isadmin) {
		if (typeof next === "function") {
			next();
		} else {
			return true;
		}
	} else {
		if (!req.session.auth) {
			res.json(error.nologin);
			return false;
		}
		const data = await cache_query("select bantime from ban_user where user_id = ?", [req.session.user_id]);
		if (!data || data.length === 0) {
			if (typeof next === "function") {
				next();
			} else {
				return true;
			}
		} else if (dayjs(data[0].bantime).isAfter(dayjs())) {
			res.json(error.errorMaker({
				ban: true,
				expire: dayjs(data[0].bantime).format("YYYY-MM-DD HH:mm:ss")
			}));
			req.session.destroy();
			return false;
		} else {
			if (typeof next === "function") {
				next();
			} else {
				return true;
			}
		}
	}
};
