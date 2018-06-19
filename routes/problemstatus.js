const express = require("express");
const router = express.Router();
const dayjs = require("dayjs");
const [error] = require("../module/const_var");
const auth = require("../middleware/auth");
const cache_query = require("../module/mysql_cache");
const const_variable = require("../module/const_name");
const getProblemStatus = async (req, res, opt = {source: true, id: 0, page: 0, from: "", page_cnt: 20}) => {
	if (opt.id === 0) {
		res.json(error.invalidParams);
	}
	else {
		let _opt = {source: true, id: 0, page: 0, from: "", page_cnt: 20};
		Object.assign(_opt, opt);
		Object.assign(opt, _opt);
		const hasOJName = (from) => {
			if (!from) {
				return "and oj_name = ?";
			}
			else {
				return "";
			}
		};
		let from = "vjudge_solution";
		if (opt.source) {
			from = "solution";
		}
		const [_result, solution, _total, _solved, _passed, _end_contest] = await Promise.all([cache_query(`select count(1) total,result from ${from}
		 where problem_id = ? ${hasOJName(opt.source)}
        group by result`, [opt.id, opt.from]),
		cache_query(`select user_id,solution_id,language,code_length,in_date,time,memory from ${from}
		where problem_id = ? and result = 4 ${hasOJName(opt.source)}
order by time,memory,code_length,in_date,solution_id limit ?,?`, (() => {
			if (!opt.source) {
				return [opt.id, opt.from, opt.page * opt.page_cnt, opt.page_cnt];
			}
			else {
				return [opt.id, opt.page * opt.page_cnt, opt.page_cnt];
			}
		})()),
		cache_query("select count(1) total,count(distinct user_id)solvesubmit from solution where problem_id = ?", [opt.id]),
		cache_query(`select count(distinct user_id)solveuser from solution where problem_id = ?
and result = 4`, [opt.id]),
		cache_query("select count(1)passed from solution where problem_id = ? and user_id = ? and result = 4", [opt.id,
			req.session.user_id]),
		cache_query(`select max(end_time) as end_time from contest where contest_id in
                            (select contest_problem.contest_id from contest_problem
                            where problem_id = ?)`, [opt.id])]);
		let browse_privilege = req.session.isadmin || req.session.source_browser;
		let after_contest = true;
		if (_end_contest.length > 0) {
			const contest_end_time = dayjs(_end_contest[0].end_time);
			after_contest = dayjs().isAfter(contest_end_time);
		}
		let passed = false;
		if (_passed.length > 0) {
			passed = _passed[0].passed > 0;
		}
		browse_privilege = browse_privilege || (after_contest || (passed));
		const submit_status = {
			total_submit: _total[0].total,
			total_solved_submit: _total[0].solvesubmit,
			total_solved_user: _solved[0].solveuser
		};
		for (let i of solution) {
			if (!browse_privilege) {
				i.code_length = "----";
				i.time = "----";
				i.memory = "----";
			}
		}
		res.json({
			status: "OK",
			data: {
				problem_status: _result,
				solution_status: solution,
				submit_status: submit_status,
				statistic_name: const_variable.result.cn,
				language_name: const_variable.language_name.local,
				isadmin: req.session.isadmin || req.session.source_browser,
				self: req.session.user_id
			}
		});
	}
};

router.get("/:id", (req, res) => {
	const id = req.params.id === undefined ? -1 : parseInt(req.params.id);
	const page = isNaN(req.query.page) ? 0 : parseInt(req.query.page);
	if (id && id < 1000) {
		res.json(error.invalidParams);
	}
	else {
		getProblemStatus(req, res, {id, page});
	}
});

router.get("/:source/:id", (req, res) => {
	const source = req.params.source === "local";
	const page = isNaN(req.query.page) ? 0 : parseInt(req.query.page);
	const id = req.params.id === undefined ? -1 : parseInt(req.params.id);
	if (id && id < 1000) {
		res.json(error.invalidParams);
	}
	else {
		getProblemStatus(req, res, {source, id, page, from: req.params.source.toUpperCase()});
	}
});

module.exports = ["/problemstatus", auth, router];
