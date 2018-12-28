/* eslint-disable no-console */
const express = require("express");
const router = express.Router();
const [error] = require("../../module/const_var");
const cache_query = require("../../module/mysql_cache");

router.get("/", (req, res, next) => {
	const browse_privilege = req.session.isadmin || req.session.source_browser;
	if (!browse_privilege) {
		res.json(error.noprivilege);
	} else {
		next();
	}
});

router.get("/", async (req, res) => {
	try {
		const sql = "SELECT `error` FROM `runtimeinfo` WHERE `solution_id`= ?";
		const solution_id = parseInt(req.query.sid) || "";
		const browse_privilege = req.session.isadmin || req.session.source_browser;
		if (!solution_id || isNaN(solution_id)) {
			res.json(error.invalidParams);
		} else if (!browse_privilege) {
			res.json(error.noprivilege);
		} else {
			const data = await cache_query(sql, [solution_id]);
			res.json({
				status: "OK",
				data
			});
		}
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

module.exports = router;
