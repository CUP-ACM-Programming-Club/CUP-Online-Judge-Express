const express = require("express");
const router = express.Router();
const query = require("../module/mysql_cache");
const auth = require("../middleware/auth");

router.get("/:user_id", (req, res) => {
	const user_id = req.params.user_id;
	let sqlQueue = [];
	sqlQueue.push(query(`
select * from (select "LOCAL" as oj_name,problem_id from solution where result = 4 and user_id = ?
group by problem_id
union all
select oj_name,problem_id from vjudge_solution where result = 4 and user_id = ?
group by concat(oj_name,problem_id)
union all
select oj_name,problem_id from vjudge_record where result = 4 and user_id = ?
group by concat(oj_name,problem_id))t
group by concat(oj_name,problem_id)`, [user_id, user_id, user_id]));
	sqlQueue.push(query("select * from solution where user_id = ?", [user_id]));
	sqlQueue.push(query("select * from privilege where user_id = ? and privilege in ('administrator','editor','source_browser')", [user_id]));
});
module.exports = ["/user", auth, router];
