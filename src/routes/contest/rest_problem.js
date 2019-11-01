const express = require("express");
const cache_query = require("../../module/mysql_cache");
const [error] = require("../../module/const_var");
const check = require("../../module/contest/check");
const dayjs = require("dayjs");
const getProblemData = require("../../module/contest/problem");
const router = express.Router();

function removeAcceptedProblem(data, acceptedSet) {
	let newArray = [];
	for (let i of data) {
		if (!acceptedSet.has(i.pnum)) {
			newArray.push(i);
		}
	}
	return newArray;
}

router.get("/:contest_id", async (req, res) => {
	let contest_id = req.params.contest_id === undefined || isNaN(req.params.contest_id) ? -1 : parseInt(req.params.contest_id);
	console.log(contest_id);
	let contest_detail = null, accepted_num = null;
	let contest_general_detail;
	try {
		if (~contest_id && (contest_detail = await check(req, res, contest_id))) {
			if (contest_detail.length > 0) contest_detail = contest_detail[0];
			const contest_is_end = dayjs(contest_detail.end_time).isBefore(dayjs());
			let sqlQueue = [];
			sqlQueue.push(getProblemData(contest_id, contest_detail.vjudge));
			sqlQueue.push(cache_query("select distinct(num) as num from solution where user_id = ? and contest_id = ? and result = 4", [req.session.user_id, contest_id]));
			[contest_general_detail, accepted_num] = await Promise.all(sqlQueue);
			let accepted_set = new Set();
			for (let i of accepted_num) {
				accepted_set.add(i.num);
			}
			contest_general_detail = removeAcceptedProblem(contest_general_detail, accepted_set);
			let browse_privilege = req.session.isadmin || req.session.contest_manager;
			if (!browse_privilege && !contest_is_end) {
				contest_general_detail = JSON.parse(JSON.stringify(contest_general_detail));
				for (let i of contest_general_detail) {
					i.pid = i.pid1 = i.pid2 = "";
				}
			}
			res.json({
				status: "OK",
				data: contest_general_detail
			});
		}
	} catch (e) {
		res.json(error.database);
	}
});

module.exports = ["/rest", router];