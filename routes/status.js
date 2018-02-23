const express = require("express");
const router = express.Router();
const query = require("../module/mysql_cache");
const escape = require("escape-html");
const const_name = require("../module/const_name");
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
		_res = await query(`select * from (SELECT * FROM solution where 1=1 
		 ${where_sql} ) sol
		 LEFT JOIN sim ON sim.s_id = sol.solution_id 
		 ORDER BY sol.solution_id DESC LIMIT ? , 20`,sql_arr);
	}
	else {
		_res = await query(`select * from (SELECT * FROM solution where problem_id>0 and contest_id is null 
		${where_sql} ) sol 
		LEFT JOIN sim ON sim.s_id = sol.solution_id 
		ORDER BY sol.solution_id DESC LIMIT ?, 20`,sql_arr);
	}
	let result = [];
	for (const val of _res) {
		result.push({
			solution_id: val.solution_id,
			user_id: val.user_id,
			nick: (await query(`SELECT nick FROM users WHERE user_id = ?`, [val.user_id]))[0].nick,
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
	},limit)
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
	await query("select * from solution where solution_id=?", [sid]).then(async (val) => {
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
				await query("select error from compileinfo where solution_id=?", [sid])
					.then((val) => {
						if (val.length > 0) {
							sendmsg.data["tr"] = escape(val[0].error);
							query("delete error from compileinfo where solution_id=?", [sid]);
						}
					});
			}
			else {
				await query("select error from runtimeinfo where solution_id=?", [sid])
					.then((val) => {
						if (val.length > 0) {
							sendmsg[res]["tr"] = escape(val[0]["error"]);
							query("delete error from runtimeinfo where solution_id=?", [sid]);
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