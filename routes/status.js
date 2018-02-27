const express = require("express");
const router = express.Router();
const query = require("../module/mysql_query");
const cache_query = require("../module/mysql_cache");
const escape = require("escape-html");
const log4js = require("../module/logger");
const logger = log4js.logger("cheese", "info");
const const_name = require("../module/const_name");
const timediff = require("timediff");
async function get_status(req,res,next,request_query = {},limit = 0){
	let _res;
	let where_sql = "";
	let sql_arr = [];
	for(let i in request_query){
		if(request_query[i]) {
			where_sql += ` and ${i} = ?`;
			sql_arr.push(request_query[i]);
		}
	}
	sql_arr.push(limit);
	if (req.session.isadmin) {
		_res = await cache_query(`select * from (SELECT * FROM solution where 1=1 
		 ${where_sql} ) sol
		 LEFT JOIN sim ON sim.s_id = sol.solution_id 
		 ORDER BY sol.solution_id DESC LIMIT ? , 20`,sql_arr);
	}
	else {
		_res = await cache_query(`select * from (SELECT * FROM solution where problem_id>0 and contest_id is null 
		${where_sql} ) sol 
		LEFT JOIN sim ON sim.s_id = sol.solution_id 
		ORDER BY sol.solution_id DESC LIMIT ?, 20`,sql_arr);
	}
	let result = [];
	for (const val of _res) {
		result.push({
			solution_id: val.solution_id,
			user_id: val.user_id,
			nick: (await cache_query("SELECT nick FROM users WHERE user_id = ?", [val.user_id]))[0].nick,
			problem_id: val.problem_id,
			result: val.result,
			contest_id: val.contest_id,
			memory: val.memory,
			time: val.time,
			language: val.language,
			length: val.code_length,
			in_date: val.in_date,
			judger: val.judger
		});
	}
	res.json({
		result:result,
		const_list:const_name,
		self:req.session.user_id,
		isadmin:req.session.isadmin
	});
}

async function getGraphData(req,res,request_query = {}){
	try {
		if (request_query.contest_id) {
			const result = await cache_query("SELECT * FROM contest WHERE contest_id = ?", [request_query.contest_id]);
			if (result.length) {
				const start_time = new Date(result[0].start_time);
				const end_time = new Date(result[0].end_time);
				let diff_time = timediff(start_time,end_time);
				if (diff_time.years * 12 + diff_time.months > 10) {
					const result = await cache_query(`SELECT sub.year,sub.month,sub.cnt as submit,accept.cnt as accepted FROM
  												(SELECT count(1) as cnt ,YEAR(in_date) as year, MONTH(in_date) as month
												FROM solution
												WHERE contest_id = ?
												GROUP BY YEAR(in_date),MONTH(in_date)) sub
												LEFT JOIN
												(SELECT count(1) as cnt ,YEAR(in_date) as year,MONTH(in_date) as month
												FROM solution 
												WHERE result = 4 AND contest_id = ?
												GROUP BY YEAR(in_date),MONTH(in_date)) accept
												ON sub.year = accept.year AND sub.month = accept.month`,
					[request_query.contest_id, request_query.contest_id]);
					res.json(result);
				}
				else if (diff_time.months * 30 + diff_time.days > 12) {
					const result = await cache_query(`SELECT sub.year,sub.month,sub.day,sub.cnt as submit,accept.cnt as accepted FROM
  												(SELECT count(1) as cnt ,YEAR(in_date) as year,MONTH(in_date) as month, DATE_FORMAT(in_date,"%d") as day
												FROM solution
												WHERE contest_id = ?
												GROUP BY MONTH(in_date),DATE_FORMAT(in_date,"%d")) sub
												LEFT JOIN
												(SELECT count(1) as cnt ,YEAR(in_date) as year,MONTH(in_date) as month, DATE_FORMAT(in_date,"%d") as day
												FROM solution 
												WHERE result = 4 AND contest_id = ?
												GROUP BY MONTH(in_date),DATE_FORMAT(in_date,"%d")) accept
												ON sub.month = accept.month AND sub.day = accept.day AND sub.year = accept.year`,
					[request_query.contest_id, request_query.contest_id]);
					res.json(result);
				}
				else if (diff_time.days * 24 + diff_time.hours > 12) {
					const result = await cache_query(`SELECT sub.year,sub.month,sub.day,sub.hour,sub.cnt as submit,accept.cnt as accepted FROM
  												(SELECT count(1) as cnt ,YEAR(in_date) as year,MONTH(in_date) as month,DATE_FORMAT(in_date,"%d") as day, HOUR(in_date) as hour
												FROM solution
												WHERE contest_id = ?
												GROUP BY DATE_FORMAT(in_date,"%d"),HOUR(in_date)) sub
												LEFT JOIN
												(SELECT count(1) as cnt ,YEAR(in_date) as year,MONTH(in_date) as month,DATE_FORMAT(in_date,"%d") as day, HOUR(in_date) as hour
												FROM solution 
												WHERE result = 4 AND contest_id = ?
												GROUP BY DATE_FORMAT(in_date,"%d"),HOUR(in_date)) accept
												ON sub.day = accept.day AND sub.hour = accept.hour AND sub.year = accept.year AND sub.month = accept.month`,
					[request_query.contest_id, request_query.contest_id]);
					res.json(result);
				}
				else if (diff_time.hours * 60 + diff_time.minutes > 12) {
					const result = await cache_query(`SELECT sub.hour,sub.minute,sub.cnt as submit,accept.cnt as accepted FROM
  												(SELECT count(1) as cnt ,HOUR(in_date) as hour, MINUTE(in_date) as minute
												FROM solution
												WHERE contest_id = ?
												GROUP BY HOUR(in_date),MINUTE(in_date)) sub
												LEFT JOIN
												(SELECT count(1) as cnt ,HOUR(in_date) as hour, MINUTE(in_date) as minute
												FROM solution 
												WHERE result = 4 AND contest_id = ?
												GROUP BY HOUR(in_date),MINUTE(in_date)) accept
												ON sub.hour = accept.hour AND sub.minute = accept.minute`,
					[request_query.contest_id, request_query.contest_id]);
					res.json(result);
				}
				else {
					const result = await cache_query(`SELECT sub.minute,sub.second,sub.cnt as submit,accept.cnt as accepted FROM
  												(SELECT count(1) as cnt ,MINUTE(in_date) as minute, SECOND(in_date) as second
												FROM solution
												WHERE contest_id = ?
												GROUP BY MINUTE(in_date),SECOND(in_date)) sub
												LEFT JOIN
												(SELECT count(1) as cnt ,MINUTE(in_date) as minute, SECOND(in_date) as second
												FROM solution 
												WHERE result = 4 AND contest_id = ?
												GROUP BY MINUTE(in_date),SECOND(in_date)) accept
												ON sub.minute = accept.minute AND sub.second = accept.second`,
					[request_query.contest_id, request_query.contest_id]);
					res.json(result);
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
			res.json(result);
		}
	}
	catch(e){
		logger.fatal(e);
	}
}

router.get("/", async function (req, res, next) {
	await get_status(req,res,next);
});

router.get("/:problem_id/:user_id/:language/:result/:limit",async function(req,res,next){
	const problem_id = req.params.problem_id === "null"?"":parseInt(req.params.problem_id);
	const user_id = req.params.user_id === "null"?"":req.params.user_id;
	const language = req.params.language === "null"?"":parseInt(req.params.language);
	const result = req.params.result === "null"?"":parseInt(req.params.result);
	const limit = req.params.limit === "null"? 0:parseInt(req.params.limit);
	await get_status(req,res,next,{
		problem_id:problem_id,
		user_id:user_id,
		language:language,
		result:result
	},limit);
});

router.get("/:problen_id/:user_id/:language/:result/:limit/:contest_id",async function(req,res,next){
	const problem_id = req.params.problem_id === "null"?"":req.params.problem_id.toUpperCase().charCodeAt(0)-"A".charCodeAt(0);
	const user_id = req.params.user_id === "null"?"":req.params.user_id;
	const language = req.params.language === "null"?"":parseInt(req.params.language);
	const result = req.params.result === "null"?"":parseInt(req.params.result);
	const contest_id = req.params.result === "null"?"":parseInt(req.params.contest_id);
	const limit = req.params.limit === "null"? 0:parseInt(req.params.limit);
	await get_status(req,res,next,{
		num:problem_id,
		user_id:user_id,
		language:language,
		result:result,
		contest_id:contest_id
	},limit);
});

router.get("/graph",async function(req,res){
	const cid = req.query.cid ? parseInt(req.query.cid):null;
	const date_flag = req.query.date;
	await getGraphData(req,res,{
		contest_id:cid,
		date_flag:date_flag
	});
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

module.exports = router;