import ContestAssistantManager from "../manager/contest/ContestAssistantManager";
import { getScoreboardWithCache, clearScoreboardCache } from "./scoreboard/optimizer";
const { error, ok } = require("../module/constants/state");
import express from "express";
const router = express.Router();
const query = require("../module/mysql_cache");
const cache_query = query;
import auth from "../middleware/auth";

router.get("/:cid", (req: any, res: any, next: any) => {
	const cid = isNaN(Number(req.params.cid)) ? -1 : parseInt(req.params.cid);
	if (cid === -1) {
		res.json(error.errorMaker("contest_id is not a number"));
	} else if (cid < 1000) {
		res.json(error.errorMaker("contest_id invalid"));
	} else {
		next();
	}
});

async function submitHandler(cid: any, browserPrivilege = false) {
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
FROM (select result, num, in_date, fingerprint, fingerprintRaw, ip, problem_id, code_length, solution_id, user_id
      from solution
      where solution.contest_id = ?
        and num >= 0
        ${browserPrivilege ? "" : " and problem_id > 0 "}
        ) solution
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
       vsol.fingerprint,
       vsol.fingerprintRaw,
       vsol.ip,
       vsol.problem_id,
       null as sim,
       vsol.code_length,
       vsol.solution_id
from (select result, num, in_date, '' as fingerprint, '' as fingerprintRaw, ip, problem_id, code_length, solution_id, user_id
      from vjudge_solution
      where vjudge_solution.contest_id = ?
        and num >= 0
        and problem_id > 0) vsol
         left join users on users.user_id = vsol.user_id
ORDER BY user_id, in_date`;
	return await query(sql, [cid, cid]);
}

async function contestUserHandler(cid: any) {
	const sql4 = `select t.*,users.nick from (select user_id from privilege where rightstr = ?)t
left join users on users.user_id = t.user_id`;
	return query(sql4, ["c" + cid]);
}

async function scoreboardHandler(cid: any, browsePrivilege = false) {

	const sql2 = "select count(distinct num)total_problem from contest_problem where contest_id = ?";
	const sql3 = "select start_time,title,show_all_ranklist from contest where contest_id = ?";

	// 使用优化后的查询（带 Redis 缓存）
	const _data = getScoreboardWithCache(cid, browsePrivilege);
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

async function lineBreakHandler(cid: any) {
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

import ContestService from "../service/ContestService";
import HttpError from "../module/util/HttpError";

router.get("/:cid", async (req: any, res: any) => {
	const cid = parseInt(req.params.cid);
	try {
		await ContestService.checkContestAccess(req, cid);
	} catch (e: any) {
		if (e instanceof HttpError) {
			res.status(e.statusCode).json({
				status: e.status,
				statement: e.statement
			});
			return;
		} else {
			// Fallback or rethrow?
			// Original check logic handled response.
			// If not HttpError (e.g. invalid params from checkContestAccess?), assume it's fatal.
			res.json(error.internalError);
			return;
		}
	}
	res.json(await scoreboardHandler(cid, req.session.isadmin || req.session.contest_manager || await ContestAssistantManager.userIsContestAssistant(cid, req.session.user_id)));
});

router.get("/:cid/line", async (req: any, res: any) => {
	const cid = parseInt(req.params.cid);
	try {
		await ContestService.checkContestAccess(req, cid);
	} catch (e: any) {
		if (e instanceof HttpError) {
			res.status(e.statusCode).json({
				status: e.status,
				statement: e.statement
			});
			return;
		} else {
			res.json(error.internalError);
			return;
		}
	}
	let [submitStat, line_break, contest_user] = await Promise.all([submitHandler(cid), lineBreakHandler(cid), contestUserHandler(cid)]);
	let map: any = {};
	for (const i of submitStat) {
		map[i.solution_id] = i;
	}
	for (const i of line_break) {
		map[i.solution_id] = Object.assign(map[i.solution_id], i);
	}
	res.json(ok.okMaker({
		map: map,
		user: contest_user
	}));
});


const routes: any = ["/scoreboard", auth, router];

// 导出缓存清除函数供其他模块使用（例如提交后清除相关比赛缓存）
routes.clearScoreboardCache = clearScoreboardCache;

module.exports = routes;

