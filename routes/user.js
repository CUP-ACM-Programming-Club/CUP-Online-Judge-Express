const express = require("express");
const router = express.Router();
const query = require("../module/mysql_cache");
const auth = require("../middleware/auth");
const const_variable = require("../module/const_name");

router.get("/:user_id", async (req, res) => {
	const user_id = req.params.user_id;
	let sqlQueue = [];
	sqlQueue.push(query(`
select * from (select "LOCAL" as oj_name,problem_id,result,language,in_date as time from solution where user_id = ? and problem_id > 0
union all
select oj_name,problem_id,result,language,in_date as time from vjudge_solution where user_id = ?
union all
select oj_name,problem_id,result,language,time from vjudge_record where user_id = ? and oj_name != "CUP"
)t
`, [user_id, user_id, user_id]));
	sqlQueue.push(query("select * from privilege where user_id = ? and rightstr in ('administrator','editor','source_browser')", [user_id]));
	sqlQueue.push(query("select * from award where user_id = ?", [user_id]));
	sqlQueue.push(query("select avatar,school,email,blog,github,nick,biography from users where user_id = ?", [user_id]));
	sqlQueue.push(query("select * from acm_member where user_id = ?", [user_id]));
	sqlQueue.push(query("select * from special_subject_problem"));
	sqlQueue.push(query("select count(1) + 1 as rnk from users where solved > (select solved from users where user_id = ?)", [user_id]));
	sqlQueue.push(query("select time from loginlog where user_id = ? order by time desc limit 1", [user_id]));
	sqlQueue.push(query("select title,article_id from article where user_id = ? order by create_time desc", [user_id]));
	const result = await Promise.all(sqlQueue);
	res.json({
		status: "OK",
		data: {
			submission: result[0],
			privilege: result[1],
			award: result[2],
			information: result[3][0],
			acm_user: result[4][0],
			special_subject: result[5],
			rank: result[6][0].rnk,
			const_variable: const_variable,
			login_time: result[7],
			article_publish: result[8]
		}
	});
});
module.exports = ["/user", auth, router];
