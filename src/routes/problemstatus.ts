const express = require("express");
const router = express.Router();
const dayjs = require("dayjs");
const [error] = require("../module/const_var");
import auth from "../middleware/auth";
const const_variable = require("../module/const_name");
import ProblemStatusService from "../service/ProblemStatusService";

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
			= await ProblemStatusService.getProblemStatusWithCache(
				opt.id,
				req.session.user_id || "",
				opt.page,
				opt.page_cnt,
				opt.source,
				opt.from
			);


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
			const range = await ProblemStatusService.getProblemDistribution(opt.id, problem_limit);
			_time_range = range.time_range;
			_memory_range = range.memory_range;
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
routes.clearProblemStatusCache = ProblemStatusService.clearProblemStatusCache.bind(ProblemStatusService);

export = routes;
