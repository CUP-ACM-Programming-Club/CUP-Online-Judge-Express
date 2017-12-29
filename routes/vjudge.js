const express = require("express");
const router = express.Router();
const NodeCache = require("node-cache");
const cache = new NodeCache({stdTTL: 24 * 60 * 60, checkperiod: 48 * 60 * 60});
const query = require("../module/mysql_query");
router.get("/:oj/:pid", function (req, res, next) {
	const pid = parseInt(req.params.pid);
	if (isNaN(pid)) {
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

router.get("/:oj/:pid", function (req, res) {
	const pid = parseInt(req.params.pid);
	const oj = req.params.oj;
	const _res = cache.get("vjudge/oj/pid" + oj + pid);
	if (_res === undefined) {
		query("SELECT * FROM vjudge_problem WHERE problem_id=? AND source=?", [pid, oj], (rows) => {
			if (rows.length !== 0) {
				res.header("Content-Type", "application/json");
				res.json(rows[0]);
				cache.set("vjudge/oj/pid" + oj + pid, rows[0], 24 * 60 * 60);
			}
			else {
				const obj = {
					msg: "404",
					statement: "problem not found"
				};
				res.header("Content-Type", "application/json");
				res.json(obj);
			}
		});
	}
	else {
		res.header("Content-Type", "application/json");
		res.json(_res);
	}
});

module.exports = router;