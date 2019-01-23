const express = require("express");

const router = express.Router();
const query = require("../module/mysql_cache");
const dayjs = require("dayjs");
const cache_query = query;
const auth = require("../middleware/auth");
const [error] = require("../module/const_var");

const check = async (req, res, cid) => {
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
	// req.session.contest[`c${cid}`]
	console.log(contest);
	if (start_time.isAfter(now)) {
		res.json(error.contestNotStart);
		return false;
	} else if (parseInt(contest[0].private) === 1) {
		if (req.session.contest[`c${cid}`]) {
			return contest;
		} else {
			res.json(error.noprivilege);
			return false;
		}
	} else {
		return contest;
	}
};


router.get("/:cid", (req, res, next) => {
	const cid = isNaN(req.params.cid) ? -1 : parseInt(req.params.cid);
	if (cid === -1) {
		res.json({
			status: "error",
			statement: "contest_id is not a number"
		});
	} else if (cid < 1000) {
		res.json({
			status: "error",
			statement: "contest_id invalid"
		});
	} else {
		next();
	}
});

router.get("/:cid", async (req, res) => {
	const cid = parseInt(req.params.cid);
	if (!await check(req, res, cid)) {
		return;
	}
	const sql = `SELECT
        users.user_id,users.nick,users.avatar,solution.result,solution.num,
        solution.in_date,solution.fingerprint,solution.fingerprintRaw,solution.ip,
        sim.sim
        FROM
        (select * from solution where solution.contest_id=? 
        and num>=0 and problem_id>0) solution
        left join users
        on users.user_id=solution.user_id 
        left join sim
        on sim.s_id = solution.solution_id
        union all 
        select users.user_id,users.nick,users.avatar,vsol.result,vsol.num,vsol.in_date,'' as fingerprint,'' as fingerprintRaw,
        vsol.ip,
        null as sim
        from
        (select * from 
        vjudge_solution where vjudge_solution.contest_id=? 
        and num>=0 and problem_id>0)vsol
        left join users on users.user_id=vsol.user_id
        ORDER BY user_id,in_date`;
	const sql2 = "select count(distinct num)total_problem from contest_problem where contest_id = ?";
	const sql3 = "select start_time,title from contest where contest_id = ?";
	const sql4 = `select t.*,users.nick from (select user_id from privilege where rightstr = ?)t
left join users on users.user_id = t.user_id`;
	const _data = query(sql, [cid, cid]);
	const _total = query(sql2, [cid]);
	const _start_time = query(sql3, [cid]);
	const _user = query(sql4, ["c" + cid]);
	Promise.all([_data, _total, _start_time, _user]).then((result) => {
		if (result[1][0].total_problem === 0) {
			res.json({
				status: "error",
				statement: "no such contest"
			});
		} else {
			res.json({
				status: "OK",
				data: result[0],
				total: result[1][0].total_problem,
				start_time: result[2][0].start_time,
				title: result[2][0].title,
				users: result[3]
			});
		}
	});
});

module.exports = ["/scoreboard", auth, router];
