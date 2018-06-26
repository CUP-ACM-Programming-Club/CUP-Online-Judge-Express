const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const dayjs = require("dayjs");
const cache_query = require("../module/mysql_cache");
const query = require("../module/mysql_query");
router.get("/", async (req, res) => {
	let sql = `select t.*,users.nick from(select * from vjudge_record
union all
    select user_id,oj_name,problem_id,in_date as time from vjudge_solution
      where user_id in (select user_id from users_account)
      group by CONCAT(oj_name,problem_id)
  union all
  select user_id,"LOCAL" as oj_name,problem_id,in_date as time from solution
  where user_id in (select user_id from users_account) and problem_id > 1909
  group by problem_id
order by time desc limit 500)t
left join users
  on users.user_id = t.user_id`;
	const data = await query(sql);
	res.json({
		status: "OK",
		data: data
	});
});

module.exports = ["/acmsubmit", auth, router];
