const {error} = require("../constants/state");
const dayjs = require("dayjs");
const cache_query = require("../mysql_cache");
module.exports = async (req, res, cid) => {
	if (cid < 1000) {
		res.json(error.invalidParams);
		return false;
	}
	const contest = await cache_query("SELECT * FROM contest WHERE contest_id = ?", [cid]);
	const start_time = dayjs(contest[0].start_time);
	const now = dayjs();
	const privilege = req.session.isadmin || req.session.contest_maker[`m${cid}`];
	if (privilege) {
		return contest;
	}
	if (global.contest_mode) {
		if (!privilege) {
			if (parseInt(contest[0].cmod_visible) === 0) {
				res.json(error.contestMode);
				return false;
			}
		}
	} else {
		if (parseInt(contest[0].cmod_visible) === 1) {
			res.json(error.contestMode);
			return false;
		}
	}
	if (start_time.isAfter(now)) {
		res.json(error.contestNotStart);
		return false;
	} else if (parseInt(contest[0].private) === 1) {
		if (req.session.contest_manager || req.session.contest[`c${cid}`]) {
			return contest;
		} else {
			await require("../login_action")(req, req.session.user_id);
			if (req.session.contest_manager || req.session.contest[`c${cid}`]) {
				return contest;
			} else {
				res.json(error.noprivilege);
				return false;
			}
		}
	} else {
		return contest;
	}
};
