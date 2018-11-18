/* eslint-disable no-unused-vars */
const express = require("express");
const router = express.Router();
const query = require("../module/mysql_query");
const cache_query = require("../module/mysql_cache");
const escape = require("escape-html");
const log4js = require("../module/logger");
const logger = log4js.logger("cheese", "info");
const const_name = require("../module/const_name");
const timediff = require("timediff");
const auth = require("../middleware/auth");
const SECONDS = 1000;
const MINUTES = 60 * SECONDS;
const HOURS = 60 * MINUTES;
const DAYS = 24 * HOURS;
const WEEKS = 7 * DAYS;
const MONTH = 30 * DAYS;
const YEARS = 365 * DAYS;

async function get_status(req, res, next, request_query = {}, limit = 0) {
	let _res;
	let where_sql = "";
	let sql_arr = [];
	for (let i in request_query) {
		if (typeof request_query[i] !== "undefined") {
			where_sql += ` and ${i} = ?`;
			sql_arr.push(request_query[i]);
		}
	}
	let _end = false;
	const browser_privilege = req.session.isadmin || req.session.source_browser;
	if (browser_privilege) {
		if (request_query.contest_id) {
			sql_arr.push(...sql_arr);
			sql_arr.push(limit);
			_res = await cache_query(`select * from
								(select fingerprint,solution_id,pass_rate,ip,contest_id,num,problem_id,user_id,time,memory,in_date,result,language,code_length,judger, "local" as oj_name 
								from solution
								where 1=1
								${where_sql}
								union all 
								select '' as fingerprint,solution_id,0.00 as pass_rate,ip,contest_id,num,problem_id,user_id,time,memory,in_date,result,language,code_length,judger,oj_name 
								from vjudge_solution
								where 1=1
								${where_sql}
								order by in_date) sol
								left join sim on sim.s_id = sol.solution_id
								order by sol.in_date desc,sol.solution_id desc limit ?,20`, sql_arr);
		}
		else {
			sql_arr.push(limit);
			_res = await cache_query(`select * from
								(select fingerprint,solution_id,pass_rate,share,ip,contest_id,num,problem_id,user_id,time,memory,in_date,result,language,code_length,judger, "local" as oj_name 
								from solution
								where 1=1
								${where_sql}) sol
								left join sim on sim.s_id = sol.solution_id
								order by sol.solution_id desc limit ?,20`, sql_arr);
		}
	}
	else if (request_query.contest_id) {
		sql_arr.push(...sql_arr);
		sql_arr.push(limit);
		_end = await cache_query("select count(1),end_time as cnt from contest where end_time<NOW() and contest_id = ?", [request_query.contest_id]);
		_end = _end[0].cnt;
		_res = await cache_query(`select * from
								(select fingerprint,solution_id,contest_id,ip,num,problem_id,user_id,time,memory,in_date,result,language,code_length,judger, "local" as oj_name 
								from solution
								where problem_id > 0 
								${where_sql}
								union all 
								select '' as fingerprint,solution_id,ip,contest_id,num,problem_id,user_id,time,memory,in_date,result,language,code_length,judger,oj_name 
								from vjudge_solution
								where problem_id > 0 
								${where_sql}
								order by in_date) sol
								left join sim on sim.s_id = sol.solution_id
								order by sol.in_date desc, sol.solution_id desc limit ?,20`, sql_arr);
	}
	else {
		// sql_arr.push(...sql_arr);
		sql_arr.push(limit);
		/* _res = await cache_query(`select * from
                                (select solution_id,share,pass_rate,problem_id,contest_id,num,user_id,time,memory,in_date,result,language,code_length,judger, "local" as oj_name
                                from solution
                                where problem_id > 0 and contest_id is null
                                ${where_sql}
                                union all select solution_id,0.00 as pass_rate,share,contest_id,num,problem_id,user_id,time,memory,in_date,result,language,code_length,judger,oj_name
                                from vjudge_solution
                                where problem_id > 0 and contest_id is null
                                ${where_sql}
                                order by in_date) sol
                                left join sim on sim.s_id = sol.solution_id
                                order by sol.in_date desc,sol.solution_id desc limit ?,20`, sql_arr);
                                */
		_res = await cache_query(`select * from
								(select fingerprint,solution_id,
								if((share = 1
           and not exists
           (select * from contest where contest_id in
           (select contest_id from contest_problem
           where solution.problem_id = contest_problem.problem_id)
          and end_time > NOW()) ),1,0) as share
								,pass_rate,problem_id,ip,contest_id,num,user_id,time,
								memory,in_date,result,language,code_length,judger, "local" as oj_name 
								from solution
								where problem_id > 0 and contest_id is null 
								${where_sql}) sol
								left join sim on sim.s_id = sol.solution_id
								order by sol.in_date desc,sol.solution_id desc limit ?,20`, sql_arr);
	}
	let result = [];
	for (const val of _res) {
		const _user_info = await cache_query("SELECT nick,avatar FROM users WHERE user_id = ?", [val.user_id]);
		if (_user_info.length > 0) {
			const nick = _user_info[0].nick.trim();
			const avatar = Boolean(_user_info[0].avatar);
			if ((request_query.contest_id && browser_privilege) || !request_query.contest_id || _end) {
				result.push({
					solution_id: val.solution_id,
					user_id: val.user_id,
					nick: nick,
					ip: val.ip,
					avatar: avatar,
					sim: val.sim,
					share: val.share,
					sim_id: val.sim_s_id,
					problem_id: val.problem_id,
					contest_id: val.contest_id,
					pass_rate: val.pass_rate,
					num: val.num,
					result: val.result,
					oj_name: val.oj_name,
					memory: val.memory,
					time: val.time,
					language: val.language,
					length: val.code_length,
					in_date: val.in_date,
					judger: val.judger,
					fingerprint: val.fingerprint
				});
			}
			else {
				const owner = req.session.user_id === val.user_id;
				const check_owner = (data) => {
					if (owner) {
						return data;
					}
					else {
						return "----";
					}
				};
				result.push({
					solution_id: val.solution_id,
					user_id: val.user_id,
					nick: nick,
					avatar: avatar,
					ip: val.ip,
					problem_id: val.problem_id,
					result: val.result,
					pass_rate: val.pass_rate,
					sim_id: val.sim_s_id,
					sim: val.sim,
					num: val.num,
					contest_id: val.contest_id,
					oj_name: val.oj_name,
					memory: check_owner(val.memory),
					time: check_owner(val.time),
					language: val.language,
					length: check_owner(val.code_length),
					in_date: val.in_date,
					judger: val.judger,
				});
			}
		}
	}
	res.json({
		result: result,
		const_list: const_name,
		self: req.session.user_id,
		isadmin: req.session.isadmin,
		browse_code: req.session.source_browser,
		end: Boolean(_end)
	});
}

async function getGraphData(req, res, request_query = {}) {
	try {
		if (request_query.contest_id) {
			const result = await cache_query("SELECT * FROM contest WHERE contest_id = ?", [request_query.contest_id]);
			if (result.length) {
				const start_time = new Date(result[0].start_time);
				const end_time = new Date(result[0].end_time);
				let diff_time = timediff(start_time, new Date(Math.min(new Date(), end_time)));

				const diffMilliseconds = diff_time.years * YEARS
                    + diff_time.months * MONTH
                    + diff_time.weeks * WEEKS
                    + diff_time.days * DAYS
                    + diff_time.minutes * MINUTES
                    + diff_time.seconds * SECONDS
                    + diff_time.milliseconds;
				if (diffMilliseconds > 10 * MONTH) {
					const result = await cache_query(`SELECT sub.year,sub.month,sub.cnt as submit,accept.cnt as accepted FROM
  												(SELECT count(1) as cnt ,YEAR(in_date) as year, MONTH(in_date) as month
												FROM solution
												WHERE contest_id = ?
												GROUP BY YEAR(in_date),MONTH(in_date)
												UNION ALL
												SELECT count(1) as cnt ,YEAR(in_date) as year, MONTH(in_date) as month
												FROM vjudge_solution
												WHERE contest_id = ?
												GROUP BY YEAR(in_date),MONTH(in_date)) sub
												LEFT JOIN
												(SELECT count(1) as cnt ,YEAR(in_date) as year,MONTH(in_date) as month
												FROM solution 
												WHERE result = 4 AND contest_id = ?
												GROUP BY YEAR(in_date),MONTH(in_date)
												UNION ALL
												SELECT count(1) as cnt ,YEAR(in_date) as year,MONTH(in_date) as month
												FROM vjudge_solution 
												WHERE result = 4 AND contest_id = ?
												GROUP BY YEAR(in_date),MONTH(in_date)) accept
												ON sub.year = accept.year AND sub.month = accept.month`,
					[request_query.contest_id, request_query.contest_id, request_query.contest_id, request_query.contest_id]);
					res.json({
						result: result,
						label: ["year", "month"]
					});
				}
				else if (diffMilliseconds > 12 * DAYS) {
					const result = await cache_query(`SELECT sub.year,sub.month,sub.day,sub.cnt as submit,accept.cnt as accepted FROM
  												(SELECT count(1) as cnt ,YEAR(in_date) as year,MONTH(in_date) as month, DATE_FORMAT(in_date,"%d") as day
												FROM solution
												WHERE contest_id = ?
												GROUP BY MONTH(in_date),DATE_FORMAT(in_date,"%d")
												UNION ALL
												SELECT count(1) as cnt ,YEAR(in_date) as year,MONTH(in_date) as month, DATE_FORMAT(in_date,"%d") as day
												FROM vjudge_solution
												WHERE contest_id = ?
												GROUP BY MONTH(in_date),DATE_FORMAT(in_date,"%d")) sub
												LEFT JOIN
												(SELECT count(1) as cnt ,YEAR(in_date) as year,MONTH(in_date) as month, DATE_FORMAT(in_date,"%d") as day
												FROM solution 
												WHERE result = 4 AND contest_id = ?
												GROUP BY MONTH(in_date),DATE_FORMAT(in_date,"%d")
												UNION ALL
												SELECT count(1) as cnt ,YEAR(in_date) as year,MONTH(in_date) as month, DATE_FORMAT(in_date,"%d") as day
												FROM vjudge_solution 
												WHERE result = 4 AND contest_id = ?
												GROUP BY MONTH(in_date),DATE_FORMAT(in_date,"%d")) accept
												ON sub.month = accept.month AND sub.day = accept.day AND sub.year = accept.year
												ORDER BY sub.year,sub.month,sub.day`,
					[request_query.contest_id, request_query.contest_id, request_query.contest_id, request_query.contest_id]);
					res.json({
						result: result,
						label: ["month", "day"]
					});
				}
				else if (diffMilliseconds > 12 * HOURS) {
					const result = await cache_query(`SELECT sub.year,sub.month,sub.day,sub.hour,sub.cnt as submit,accept.cnt as accepted FROM
  												(SELECT count(1) as cnt ,YEAR(in_date) as year,MONTH(in_date) as month,DATE_FORMAT(in_date,"%d") as day, HOUR(in_date) as hour
												FROM solution
												WHERE contest_id = ?
												GROUP BY DATE_FORMAT(in_date,"%d"),HOUR(in_date)
												UNION ALL
												SELECT count(1) as cnt ,YEAR(in_date) as year,MONTH(in_date) as month,DATE_FORMAT(in_date,"%d") as day, HOUR(in_date) as hour
												FROM vjudge_solution
												WHERE contest_id = ?
												GROUP BY DATE_FORMAT(in_date,"%d"),HOUR(in_date)) sub
												LEFT JOIN
												(SELECT count(1) as cnt ,YEAR(in_date) as year,MONTH(in_date) as month,DATE_FORMAT(in_date,"%d") as day, HOUR(in_date) as hour
												FROM solution 
												WHERE result = 4 AND contest_id = ?
												GROUP BY DATE_FORMAT(in_date,"%d"),HOUR(in_date)
												UNION ALL
												SELECT count(1) as cnt ,YEAR(in_date) as year,MONTH(in_date) as month,DATE_FORMAT(in_date,"%d") as day, HOUR(in_date) as hour
												FROM vjudge_solution 
												WHERE result = 4 AND contest_id = ?
												GROUP BY DATE_FORMAT(in_date,"%d"),HOUR(in_date)) accept
												ON sub.day = accept.day AND sub.hour = accept.hour AND sub.year = accept.year AND sub.month = accept.month`,
					[request_query.contest_id, request_query.contest_id, request_query.contest_id, request_query.contest_id]);
					res.json({
						result: result,
						label: ["day", "hour"]
					});
				}
				else if (diffMilliseconds > 12 * MINUTES) {
					const result = await cache_query(`SELECT sub.hour,sub.minute,sub.cnt as submit,accept.cnt as accepted FROM
  												(SELECT count(1) as cnt ,HOUR(in_date) as hour, MINUTE(in_date) as minute
												FROM solution
												WHERE contest_id = ?
												GROUP BY HOUR(in_date),MINUTE(in_date)
												UNION ALL
												SELECT count(1) as cnt ,HOUR(in_date) as hour, MINUTE(in_date) as minute
												FROM vjudge_solution
												WHERE contest_id = ?
												GROUP BY HOUR(in_date),MINUTE(in_date)) sub
												LEFT JOIN
												(SELECT count(1) as cnt ,HOUR(in_date) as hour, MINUTE(in_date) as minute
												FROM solution 
												WHERE result = 4 AND contest_id = ?
												GROUP BY HOUR(in_date),MINUTE(in_date)
												UNION ALL
												SELECT count(1) as cnt ,HOUR(in_date) as hour, MINUTE(in_date) as minute
												FROM vjudge_solution 
												WHERE result = 4 AND contest_id = ?
												GROUP BY HOUR(in_date),MINUTE(in_date)) accept
												ON sub.hour = accept.hour AND sub.minute = accept.minute`,
					[request_query.contest_id, request_query.contest_id, request_query.contest_id, request_query.contest_id]);
					res.json({
						result: result,
						label: ["hour", "minute"]
					});
				}
				else {
					const result = await cache_query(`SELECT sub.minute,sub.second,sub.cnt as submit,accept.cnt as accepted FROM
  												(SELECT count(1) as cnt ,MINUTE(in_date) as minute, SECOND(in_date) as second
												FROM solution
												WHERE contest_id = ?
												GROUP BY MINUTE(in_date),SECOND(in_date)
												UNION ALL
												SELECT count(1) as cnt ,MINUTE(in_date) as minute, SECOND(in_date) as second
												FROM vjudge_solution
												WHERE contest_id = ?
												GROUP BY MINUTE(in_date),SECOND(in_date)) sub
												LEFT JOIN
												(SELECT count(1) as cnt ,MINUTE(in_date) as minute, SECOND(in_date) as second
												FROM solution 
												WHERE result = 4 AND contest_id = ?
												GROUP BY MINUTE(in_date),SECOND(in_date)
												UNION ALL
												SELECT count(1) as cnt ,MINUTE(in_date) as minute, SECOND(in_date) as second
												FROM vjudge_solution 
												WHERE result = 4 AND contest_id = ?
												GROUP BY MINUTE(in_date),SECOND(in_date)) accept
												ON sub.minute = accept.minute AND sub.second = accept.second`,
					[request_query.contest_id, request_query.contest_id, request_query.contest_id, request_query.contest_id]);
					res.json({
						result: result,
						label: ["minute", "second"]
					});
				}
			}
		}
		else {
			const result = await cache_query(`SELECT sub.year,sub.month,sub.cnt as submit,accept.cnt as accepted FROM
  												(SELECT count(1) as cnt ,YEAR(in_date) as year, MONTH(in_date) as month
												FROM solution
												GROUP BY YEAR(in_date),MONTH(in_date)) sub
												LEFT JOIN
												(SELECT count(1) as cnt ,YEAR(in_date) as year,MONTH(in_date) as month
												FROM solution 
												WHERE result = 4 
												GROUP BY YEAR(in_date),MONTH(in_date)) accept
												ON sub.year = accept.year AND sub.month = accept.month`);
			res.json({
				result: result,
				label: ["year", "month"]
			});
		}
	}
	catch (e) {
		logger.fatal(e);
	}
}

router.get("/", async function (req, res, next) {
	await get_status(req, res, next);
});

router.get("/:problem_id/:user_id/:language/:result/:limit", async function (req, res, next) {
	const problem_id = req.params.problem_id === "null" ? undefined : parseInt(req.params.problem_id);
	const user_id = req.params.user_id === "null" ? undefined : req.params.user_id;
	const language = req.params.language === "null" ? undefined : parseInt(req.params.language);
	const result = req.params.result === "null" ? undefined : parseInt(req.params.result);
	const limit = req.params.limit === "null" ? 0 : parseInt(req.params.limit);
	if (isNaN(problem_id) && problem_id !== undefined) {
		res.json({
			result: result,
			const_list: const_name,
			self: req.session.user_id,
			isadmin: req.session.isadmin,
			browse_code: req.session.source_browser,
			end: false
		});
	}
	else {
		await get_status(req, res, next, {
			problem_id: problem_id,
			user_id: user_id,
			language: language,
			result: result
		}, limit);
	}
});

router.get("/:problem_id/:user_id/:language/:result/:limit/:contest_id", async function (req, res, next) {
	let problem_id;
	if (isNaN(req.params.problem_id)) {
		if (req.params.problem_id === "null" || !req.params.problem_id) {
			problem_id = undefined;
		}
		else {
			problem_id = req.params.problem_id.toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
		}
	}
	else {
		problem_id = parseInt(req.params.problem_id);
	}
	const user_id = req.params.user_id === "null" ? undefined : req.params.user_id;
	const language = req.params.language === "null" ? undefined : parseInt(req.params.language);
	const result = req.params.result === "null" ? undefined : parseInt(req.params.result);
	const contest_id = req.params.contest_id === "null" ? undefined : parseInt(req.params.contest_id);
	const limit = req.params.limit === "null" ? 0 : parseInt(req.params.limit);
	await get_status(req, res, next, {
		num: problem_id,
		user_id: user_id,
		language: language,
		result: result,
		contest_id: contest_id
	}, limit);
});

router.get("/graph", async function (req, res) {
	const cid = req.query.cid ? parseInt(req.query.cid) : null;
	const date_flag = req.query.date;
	await getGraphData(req, res, {
		contest_id: cid,
		date_flag: date_flag
	});
});

router.get("/solution", async function (req, res) {
	const sid = req.query.sid ? parseInt(req.query.sid) : null;
	const browse_privilege = req.session.isadmin || req.session.source_browser;
	if (sid) {
		const _result = await query(`SELECT user_id,language,if((share = 1
    or solution_id in (select solution_id from tutorial where solution.solution_id = ?))
           and not exists
           (select * from contest where contest_id in
           (select contest_id from contest_problem
           where solution.problem_id = contest_problem.problem_id)
          and end_time > NOW()),1,0) as share,time,memory,code_length from solution WHERE solution_id = ?`, [sid, sid]);
		if (_result.length > 0 && (_result[0].user_id === req.session.user_id || browse_privilege || _result[0].share === 1)) {
			res.json({
				status: "OK",
				data: {
					solution_id: sid,
					user_id: _result[0].user_id,
					language: _result[0].language,
					time: _result[0].time,
					memory: _result[0].memory
				}
			});
		}
		else {
			res.json({
				status: "error",
				statement: "error sid / not privilege"
			});
		}
	}
	else {
		res.json({
			status: "error",
			statement: "invalid parameter"
		});
	}
});

router.get("/:sid/:tr", function (req, res, next) {
	const sid = parseInt(req.params.sid);
	if (isNaN(sid)) {
		next();
	}
	else {
		next("route");
	}
}, function (req, res) {
	const errmsg = {
		status: "error",
		statement: "invalid parameter"
	};
	res.header("Content-Type", "application/json");
	res.json(errmsg);
});

router.get("/:sid/:tr", async function (req, res) {
	const sid = parseInt(req.params.sid);
	const test_run = req.params.tr;
	await cache_query("select * from solution where solution_id=?", [sid]).then(async (val) => {
		const dataPack = val[0];
		const sendmsg = {
			status: "OK",
			data: {
				result: dataPack["result"],
				memory: dataPack["memory"],
				time: dataPack["time"],
				pass_point: dataPack["pass_point"]
			}
		};
		if (test_run.length > 0 && parseInt(dataPack["result"]) > 3) {
			const result_flag = parseInt(dataPack["result"]);
			if (result_flag === 11) {
				await cache_query("select error from compileinfo where solution_id=?", [sid])
					.then((val) => {
						if (val.length > 0) {
							sendmsg.data["tr"] = escape(val[0].error);
							query("delete error from compileinfo where solution_id=?", [sid]);
						}
					});
			}
			else {
				await cache_query("select error from runtimeinfo where solution_id=?", [sid])
					.then((val) => {
						if (val.length > 0) {
							sendmsg[res]["tr"] = escape(val[0]["error"]);
							cache_query("delete error from runtimeinfo where solution_id=?", [sid]);
						}
					});
			}
		}
		res.header("Content-Type", "application/json");
		res.json(sendmsg);
	}).catch((val) => {
		res.header("Content-Type", "application/json");
		res.json({
			status: "error",
			statement: val
		});
	});
});

router.use("/result", require("./status/submit_result"));
router.use("/device", require("./status/device"));
router.use("/sim", require("./status/sim"));
router.use("/runtimeerror", require("./status/runtime_error"));

module.exports = ["/status", auth, router];
