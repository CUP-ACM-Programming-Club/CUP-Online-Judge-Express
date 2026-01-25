const express = require("express");
const router = express.Router();
const dayjs = require("dayjs");
const [error] = require("../module/const_var");
import auth from "../middleware/auth";
const cache_query = require("../module/mysql_cache");
const const_variable = require("../module/const_name");
import { getProblemStatusWithCache, clearProblemStatusCache } from "./problemstatus/optimizer";
const getProblemStatus = async (req: any, res: any, opt: any = { source: true, id: 0, page: 0, from: "", page_cnt: 20 }) => {
	if (opt.id === 0) {
		res.json(error.invalidParams);
	}
	else {
		let _opt = { source: true, id: 0, page: 0, from: "", page_cnt: 20 };
		Object.assign(_opt, opt);
		Object.assign(opt, _opt);

		let from = "vjudge_solution";
		if (opt.source) {
			from = "solution";
		}

		// 使用优化后的查询（合并统计 + Redis 缓存）
		const { stats, solutions: solution, end_contest: _end_contest, problem_limit }
			= await getProblemStatusWithCache(
				opt.id,
				req.session.user_id || "",
				opt.page,
				opt.page_cnt,
				opt.source,
				opt.from
			);

		// 构建时间/内存分布查询（仅当用户有权限时）
		const time_limit = Math.max(1, problem_limit.time_limit * 1000);
		const memory_limit = Math.max(32, problem_limit.memory_limit * 1024);
		const time_step = parseFloat(String(time_limit)) * 2 / 25;
		const memory_step = parseFloat(String(memory_limit)) * 2 / 25;

		let sql1 = `select count(1)total,language,diff from (select case`;
		for (let i = 0; i <= time_limit; i += time_step) {
			sql1 += ` when time between ${parseInt(String(i))} and ${parseInt(String(i + time_step))} then '${parseInt(String(i))}-${parseInt(String(i + time_step))}' `;
		}
		sql1 += `else '>${time_limit}' end as diff ,language from solution where problem_id = ? and result = 4)t group by diff,language`;

		let sql2 = `select count(1)total,language,diff from (select case`;
		for (let i = 0; i <= memory_limit; i += memory_step) {
			sql2 += ` when memory between ${parseInt(String(i))} and ${parseInt(String(i + memory_step))} then '${parseInt(String(i))}-${parseInt(String(i + memory_step))}' `;
		}
		sql2 += `else '>${memory_limit}' end as diff,language from solution where problem_id = ? and result = 4)t group by diff,language`;

		let browse_privilege = req.session.isadmin || req.session.source_browser;
		let after_contest = true;
		if (_end_contest.length > 0) {
			const contest_end_time = dayjs(_end_contest[0].end_time);
			after_contest = dayjs().isAfter(contest_end_time);
		}
		let passed = stats.user_passed > 0;
		browse_privilege = browse_privilege || (after_contest || passed);

		// 查询时间/内存分布（仅有权限时）
		let _time_range: any = [];
		let _memory_range: any = [];
		if (browse_privilege) {
			[_time_range, _memory_range] = await Promise.all([
				cache_query(sql1, [opt.id]),
				cache_query(sql2, [opt.id])
			]);
		}

		const submit_status = {
			total_submit: stats.total_submit,
			total_solved_submit: stats.total_solved_submit,
			total_solved_user: stats.total_solved_user
		};

		for (let i of solution) {
			if (!browse_privilege) {
				i.code_length = "----";
				i.time = "----";
				i.memory = "----";
			}
		}

		let sendJSON: any = {
			status: "OK",
			data: {
				problem_status: stats.problem_status,
				solution_status: solution,
				submit_status: submit_status,
				statistic_name: const_variable.result.cn,
				language_name: const_variable.language_name.local,
				isadmin: req.session.isadmin || req.session.source_browser,
				self: req.session.user_id
			}
		};
		if (browse_privilege) {
			sendJSON.data.time_range = _time_range;
			sendJSON.data.memory_range = _memory_range;
		}
		res.json(sendJSON);
	}
};

router.get("/:id", (req: any, res: any) => {
	const id = req.params.id === undefined ? -1 : parseInt(req.params.id);
	const page = isNaN(req.query.page) ? 0 : parseInt(req.query.page);
	if (id && id < 1000) {
		res.json(error.invalidParams);
	}
	else {
		getProblemStatus(req, res, { id, page });
	}
});

router.get("/:source/:id", (req: any, res: any) => {
	const source = req.params.source === "local";
	const page = isNaN(req.query.page) ? 0 : parseInt(req.query.page);
	const id = req.params.id === undefined ? -1 : parseInt(req.params.id);
	if (id && id < 1000) {
		res.json(error.invalidParams);
	}
	else {
		getProblemStatus(req, res, { source, id, page, from: req.params.source.toUpperCase() });
	}
});

const routes: any = ["/problemstatus", auth, router];

// 导出缓存清除函数供其他模块使用
routes.clearProblemStatusCache = clearProblemStatusCache;

export = routes;
