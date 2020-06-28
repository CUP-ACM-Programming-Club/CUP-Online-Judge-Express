const express = require("express");

const router = express.Router();
const query = require("../module/mysql_cache");
const cache_query = query;
const auth = require("../middleware/auth");
const [error, ok] = require("../module/const_var");
const check = require("../module/contest/check");

router.get("/:cid", (req, res, next) => {
	const cid = isNaN(req.params.cid) ? -1 : parseInt(req.params.cid);
	if (cid === -1) {
		res.json(error.errorMaker("contest_id is not a number"));
	} else if (cid < 1000) {
		res.json(error.errorMaker("contest_id invalid"));
	} else {
		next();
	}
});

async function submitHandler(cid) {
	const sql = `SELECT users.user_id,
       users.nick,
       users.avatar,
       users.avatarUrl,
       solution.result,
       solution.num,
       solution.in_date,
       solution.fingerprint,
       solution.fingerprintRaw,
       solution.ip,
       solution.problem_id,
       sim.sim,
       solution.code_length,
       solution.solution_id
FROM (select *
      from solution
      where solution.contest_id = ?
        and num >= 0
        and problem_id > 0) solution
         left join users
                   on users.user_id = solution.user_id
         left join sim
                   on sim.s_id = solution.solution_id
union all
select users.user_id,
       users.nick,
       users.avatar,
       users.avatarUrl,
       vsol.result,
       vsol.num,
       vsol.in_date,
       ''   as fingerprint,
       ''   as fingerprintRaw,
       vsol.ip,
       vsol.problem_id,
       null as sim,
       vsol.code_length,
       vsol.solution_id
from (select *
      from vjudge_solution
      where vjudge_solution.contest_id = ?
        and num >= 0
        and problem_id > 0) vsol
         left join users on users.user_id = vsol.user_id
ORDER BY user_id, in_date`;
	return await query(sql, [cid, cid]);
}

async function contestUserHandler(cid) {
	const sql4 = `select t.*,users.nick from (select user_id from privilege where rightstr = ?)t
left join users on users.user_id = t.user_id`;
	return query(sql4, ["c" + cid]);
}

async function scoreboardHandler(cid) {

	const sql2 = "select count(distinct num)total_problem from contest_problem where contest_id = ?";
	const sql3 = "select start_time,title,show_all_ranklist from contest where contest_id = ?";

	const _data = submitHandler(cid);
	const _total = query(sql2, [cid]);
	const _start_time = query(sql3, [cid]);
	const _user = contestUserHandler(cid);
	const result = await Promise.all([_data, _total, _start_time, _user]);
	if (result[2].length === 0) {
		return error.errorMaker("no such contest");
	} else {
		return {
			status: "OK",
			data: result[0],
			total: result[1][0].total_problem,
			start_time: result[2][0].start_time,
			title: result[2][0].title,
			show_all_ranklist: result[2][0].show_all_ranklist,
			users: result[3]
		};
	}
}

async function lineBreakHandler(cid) {
	const sql = `select code_stat.solution_id,
       code_stat.line,
       user.user_id, user.problem_id
from (select solution_id,
             length(source) - length(replace(source, '\\n', '')) as line,
             source
      from source_code_user
      where solution_id in
            (select solution_id
             from solution
             where contest_id = ?
               and num >= 0
               and problem_id > 0)) code_stat
         left join
         (select user_id, solution_id, problem_id from solution where contest_id = ?) user
         on user.solution_id = code_stat.solution_id`;
	return await cache_query(sql, [cid, cid]);
}

router.get("/:cid", async (req, res) => {
	const cid = parseInt(req.params.cid);
	if (!await check(req, res, cid)) {
		return;
	}
	res.json(await scoreboardHandler(cid));
});

router.get("/:cid/line", async (req, res) => {
	const cid = parseInt(req.params.cid);
	if(!await check(req, res, cid)) {
		return;
	}
	let [submitStat, line_break, contest_user] = await Promise.all([submitHandler(cid), lineBreakHandler(cid), contestUserHandler(cid)]);
	let map = {};
	for(const i of submitStat) {
		map[i.solution_id] = i;
	}
	for(const i of line_break) {
		map[i.solution_id] = Object.assign(map[i.solution_id], i);
	}
	res.json(ok.okMaker({
		map: map,
		user: contest_user
	}));
});

module.exports = ["/scoreboard", auth, router];
