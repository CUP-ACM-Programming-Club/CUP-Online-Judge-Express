const express = require("express");
const router = express.Router();
const query = require("../module/mysql_cache");
const escape = require("escape-html");

router.get("/", async function (req, res, next) {
	let _res;
	if (req.session.isadmin) {
		console.log('isadmin');
		_res = await query(`SELECT * FROM solution LEFT JOIN sim ON sim.s_id = solution.solution_id 
		 ORDER BY solution.solution_id DESC LIMIT 20`);
	}
	else {
		_res = await query(`select * from (SELECT * FROM solution where problem_id>0 and contest_id is null) sol 
		LEFT JOIN sim ON sim.s_id = sol.solution_id 
		ORDER BY sol.solution_id DESC LIMIT 20`);
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
	res.json(result);
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