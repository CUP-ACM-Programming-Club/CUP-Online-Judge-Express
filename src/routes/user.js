const express = require("express");
const router = express.Router();
const query = require("../module/mysql_cache");
const auth = require("../middleware/auth");
const const_variable = require("../module/const_name");
const [error] = require("../module/const_var");

router.use(...require("./user/recent_register"));
router.use(...require("./user/register_timeline"));
router.use(...require("./user/submit_stat"));
router.use(...require("./user/self"));
router.use(...require("./user/update"));
router.use(...require("./user/lost"));
router.use(...require("./user/tutorial"));
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
	sqlQueue.push(query("select * from award where user_id = ? order by year", [user_id]));
	sqlQueue.push(query("select avatar,avatarUrl,school,email,blog,github,reg_time,nick,biography,vjudge_accept from users where user_id = ?", [user_id]));
	sqlQueue.push(query("select * from acm_member where user_id = ?", [user_id]));
	sqlQueue.push(query("select * from special_subject_problem"));
	sqlQueue.push(query("select count(1) + 1 as rnk from users where solved > (select solved from users where user_id = ?)", [user_id]));
	sqlQueue.push(query("select time from loginlog where user_id = ? order by time desc limit 1", [user_id]));
	sqlQueue.push(query("select title,article_id from article where user_id = ? order by create_time desc", [user_id]));
	sqlQueue.push(query(`select count(1) as cnt,year(in_date) as year,month(in_date) as month,day(in_date) as day from solution
where user_id = ? and in_date >= DATE_SUB(NOW(),INTERVAL 1 YEAR)
group by year(in_date),month(in_date),day(in_date)`, [user_id]));
	sqlQueue.push(query(`select count(1) as cnt,os_name,os_version from loginlog 
where user_id = ? and os_name is not null
group by os_name,os_version`, [user_id]));
	sqlQueue.push(query(`select count(1) as cnt,browser_name,browser_version from loginlog
where user_id = ? and browser_name is not null
group by browser_name,browser_version`, [user_id]));
	sqlQueue.push(query(`select count(distinct(problem_id)) as cnt from solution where solution_id in (
  select s_id as solution_id
  from sim
  where s_user_id = ?
)`, [user_id]));
	sqlQueue.push(query("select avg(sim) as average from sim where s_user_id = ?", [user_id]));
	sqlQueue.push(query(`select avg(code_length) as average from solution where solution_id in (
  select s_id as solution_id
  from sim
  where s_user_id = ?
)`, [user_id]));
	sqlQueue.push(query("select count(1) as cnt from sim where s_user_id = ?", [user_id]));
	sqlQueue.push(query("select count(1) + 1 as rnk from users where vjudge_accept > (select vjudge_accept from users where user_id = ?)", [user_id]));
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
			article_publish: result[8],
			submission_count: result[9],
			browser: result[11],
			os: result[10],
			sim_count: result[12][0].cnt || 0,
			sim_average_percentage: result[13][0].average || 0,
			sim_average_length: result[14][0].average || 0,
			total_sim_time: result[15][0].cnt || 0,
			vjudge_rank: result[16][0].rnk
		},
		isadmin: req.session.isadmin
	});
});

router.get("/nick/:nick", async (req, res) => {
	const nick = req.params.nick;
	const data = await query("select user_id from users where nick = ?", [nick]);
	if (data && data.length > 0) {
		res.json({
			status: "OK",
			nick,
			data
		});
	} else {
		res.json(error.errorMaker("No such user!"));
	}
});

module.exports = ["/user", auth, router];
