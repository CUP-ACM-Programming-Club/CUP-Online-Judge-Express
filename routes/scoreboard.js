const express = require("express");

const router = express.Router();
const query = require("../module/mysql_cache");
const auth = require("../middleware/auth");

router.get("/:cid", (req, res, next) => {
	const cid = isNaN(req.params.cid) ? -1 : parseInt(req.params.cid);
	if (cid === -1) {
		res.json({
			status: "error",
			statement: "contest_id is not a number"
		});
	}
	else if (cid < 1000) {
		res.json({
			status: "error",
			statement: "contest_id invalid"
		});
	}
	else {
		next();
	}
});

router.get("/:cid", async (req, res) => {
	const cid = parseInt(req.params.cid);
	const sql = `SELECT
        users.user_id,users.nick,solution.result,solution.num,
        solution.in_date
        FROM
        (select * from solution where solution.contest_id=? 
        and num>=0 and problem_id>0) solution
        left join users
        on users.user_id=solution.user_id 
        union all 
        select users.user_id,users.nick,vsol.result,vsol.num,vsol.in_date
        from
        (select * from 
        vjudge_solution where vjudge_solution.contest_id=? 
        and num>=0 and problem_id>0)vsol
        left join users on users.user_id=vsol.user_id
        ORDER BY user_id,in_date`;
	const sql2 = "select count(distinct num)total_problem from contest_problem where contest_id = ?";
	const _data = query(sql, [cid, cid]);
	const _total = query(sql2, [cid]);
	Promise.all([_data, _total]).then((result) => {
		if (result[1][0].total_problem === 0) {
			res.json({
				status: "error",
				statement: "no such contest"
			});
		}
		else {
			res.json({
				status: "OK",
				data: result[0],
				total: result[1][0].total_problem
			});
		}
	});
});

module.exports = ["/scoreboard", auth, router];
