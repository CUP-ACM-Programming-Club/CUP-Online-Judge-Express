/* eslint-disable no-console */
const express = require("express");
const router = express.Router();
const [error, ok] = require("../../module/const_var");
const cache_query = require("../../module/mysql_cache");
const getSim = require("../../module/status/sim");

router.get("/", async (req, res) => {
	const cid = parseInt(req.query.cid);
	try {
		const data = await cache_query(`select s.*,u2.nick as snick from(select t.*,u1.nick from (select * from sim where
		 s_user_id is not null and s_s_user_id is not null 
		 ${isNaN(cid)?"":` and s_id in (select solution_id from
		 solution where contest_id = ?)`} )t left join users as u1
		on u1.user_id = t.s_user_id)s
left join users as u2
		on u2.user_id = s.s_s_user_id`,[cid]);
		res.json(ok.okMaker(data));
	}
	catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

router.get("/:cid", async (req, res) => {
	try {
		let data = await getSim(req.params.cid);
		res.json(ok.okMaker(data));
	}
	catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

module.exports = router;
