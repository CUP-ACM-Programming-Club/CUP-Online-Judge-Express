const express = require("express");
const router = express.Router();
const [error] = require("../module/const_var");
const auth = require("../middleware/auth");
const cache_query = require("../module/mysql_cache");
const getProblemStatus = async (res, req, opt = {source: true, id: 0, page: 0, from: "", page_cnt: 20}) => {
	if (opt.id === 0) {
		res.json(error.invalidParams);
	}
	else {
		const hasOJName = () => {
			if (from) {
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
		const [_result, solution] = await Promise.all([cache_query(`select count(1) total,result from ${from}
		 where problem_id = ? ${hasOJName()}
        group by result`, [opt.id, opt.from]),
		cache_query(`select user_id,solution_id,language,code_length,in_date,time,memory from ${from}
		where problem_id = ? ${hasOJName()}
order by time,memory,code_length,in_date,solution_id limit ?,?`, (() => {
			if (from) {
				return [opt.id, opt.from, opt.page, opt.page_cnt];
			}
			else {
				return [opt.id, opt.page, opt.page_cnt];
			}
		})())]);
		res.json({
			status: "OK",
			data: {
				problem_status: _result[0],
				solution_status: solution
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
