const express = require("express");
const router = express.Router();
const query = require("../module/mysql_query");
const escape = require("escape-html");
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