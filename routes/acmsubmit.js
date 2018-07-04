const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const const_variable = require("../module/const_name");
const cache_query = require("../module/mysql_cache");
router.get("/", async (req, res) => {
	let wheresql = "";
	let andsql = "";
	let sqlArr = [];
	if (req.query.name) {
		wheresql = " where user_id = ? ";
		andsql = " and user_id = ? ";
		for (let i = 0; i < 3; ++i) {
			sqlArr.push(req.query.name);
		}
	}

	let sql = `select t.*,users.nick from(select user_id,oj_name,problem_id,time,result,time_running,
	memory,code_length,language
	 from vjudge_record 
	 ${wheresql}
union all
    select user_id,oj_name,problem_id,in_date as time,result,time as time_running
    ,memory,code_length,language
    from vjudge_solution 
      where user_id in (select user_id from users_account) ${andsql}
  union all
  select user_id,"LOCAL" as oj_name,problem_id,in_date as time,result,time as time_running
    ,memory,code_length,language from solution
  where user_id in (select user_id from users_account) and problem_id > 1909 ${andsql}
order by time desc limit 500)t
left join users
  on users.user_id = t.user_id`;
	const data = await cache_query(sql,sqlArr);
	res.json({
		status: "OK",
		data: data,
		const_data: const_variable.result.cn,
		language_name: const_variable.language_name,
		judge_color:const_variable.judge_color,
		icon_list:const_variable.icon_list
	});
});

module.exports = ["/acmsubmit", auth, router];
