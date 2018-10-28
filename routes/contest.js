/* eslint-disable no-console */
const express = require("express");
const dayjs = require("dayjs");
const md = require("markdown-it")({
	html: true,
	breaks: true
});

const mh = require("markdown-it-highlightjs");
const mk = require("@ryanlee2014/markdown-it-katex");
md.use(mk);
md.use(mh);
const cache_query = require("../module/mysql_cache");
const [error] = require("../module/const_var");
const auth = require("../middleware/auth");
const router = express.Router();
const check = async (req, res, cid) => {
	if (cid < 1000) {
		res.json(error.invalidParams);
		return false;
	}
	const contest = await cache_query("SELECT * FROM contest WHERE contest_id = ?", [cid]);
	const start_time = dayjs(contest[0].start_time);
	const now = dayjs();
	if (contest[0].private === 1 && !(req.session.isadmin || req.session.contest[`c${cid}`] || req.session.contest_maker[`m${cid}`])) {
		res.json(error.noprivilege);
		return false;
	}
	else if (start_time.isAfter(now)) {
		res.json(error.contestNotStart);
		return false;
	}
	else {
		return contest;
	}
};


router.get("/general/:cid", async (req, res) => {
	let cid = req.params.cid === undefined || isNaN(req.params.cid) ? -1 : parseInt(req.params.cid);
	if (~cid && check(req, res, cid)) {
		const contest_general_detail = await cache_query(`select t1.contest_id,t1.title,t1.start_time,
		t1.end_time,t1.description,t1.cmod_visible,t2.total_problem from (select * from contest where contest_id = ?)t1
  left join (select count(1)total_problem,contest_id from contest_problem where contest_id = ?)t2
  on t1.contest_id = t2.contest_id`, [cid, cid]);
		if (contest_general_detail.length < 1) {
			res.json(error.invalidParams);
		}
		else {
			res.json({
				status: "OK",
				data: contest_general_detail[0]
			});
		}
	}
});

router.get("/problem/:cid", async (req, res) => {
	let cid = req.params.cid === undefined || isNaN(req.params.cid) ? -1 : parseInt(req.params.cid);
	let contest_detail = null;
	try {
		if (~cid && (contest_detail = await check(req, res, cid))) {
			if (contest_detail.length > 0) contest_detail = contest_detail[0];
			let contest_general_detail = null;
			const contest_is_end = dayjs(contest_detail.end_time).isBefore(dayjs());
			let sqlQueue = [];
			if (contest_detail.vjudge) {
				sqlQueue.push(cache_query(`select * from (SELECT \`problem\`.\`title\` as \`title\`,\`problem\`.\`problem_id\` as \`pid\`,source as source,"LOCAL" as oj_name,contest_problem.num as pnum

		FROM \`contest_problem\`,\`problem\`

		WHERE \`contest_problem\`.\`problem_id\`=\`problem\`.\`problem_id\` 

		AND \`contest_problem\`.\`contest_id\`= ? AND \`contest_problem\`.\`oj_name\` IS NULL ORDER BY \`contest_problem\`.\`num\` 
                ) problem
                left join (select problem_id pid1,num,count(1) accepted from solution where result=4 and contest_id= ? group by pid1) p1 on problem.pid=p1.pid1
                left join (select problem_id pid2,num,count(1) submit from solution where contest_id= ?  group by pid2) p2 on problem.pid=p2.pid2
union all
select * from (SELECT \`vjudge_problem\`.\`title\` as \`title\`,\`vjudge_problem\`.\`problem_id\` as \`pid\`,"" as source,source as oj_name,contest_problem.num as pnum FROM
 \`contest_problem\`,\`vjudge_problem\`
WHERE \`contest_problem\`.\`problem_id\`=\`vjudge_problem\`.\`problem_id\`
AND \`contest_problem\`.\`contest_id\`= ? AND \`contest_problem\`.\`oj_name\`=\`vjudge_problem\`.\`source\` ORDER BY \`contest_problem\`.\`num\`) vproblem
left join(select problem_id pid1,num,count(1) accepted from vjudge_solution where result=4 and contest_id= ? group by num) vp1 on vproblem.pid=vp1.pid1 and vproblem.pnum=vp1.num
left join(select problem_id pid2,num,count(1) submit from vjudge_solution where contest_id= ? group by num) vp2 on vproblem.pid=vp2.pid2 and vproblem.pnum=vp2.num
order by pnum;`, [cid, cid, cid, cid, cid, cid]));

			}
			else {
				sqlQueue.push(cache_query(`select *
from (SELECT
        \`problem\`.\`title\`      as \`title\`,
        \`problem\`.\`problem_id\` as \`pid\`,
        source                 as source,
        contest_problem.num    as pnum

      FROM \`contest_problem\`, \`problem\`

      WHERE \`contest_problem\`.\`problem_id\` = \`problem\`.\`problem_id\`

            AND \`contest_problem\`.\`contest_id\` = ? AND \`contest_problem\`.\`oj_name\` IS NULL
      ORDER BY \`contest_problem\`.\`num\`
     ) problem
  left join (select
               problem_id pid1,
               num,
               count(1)   accepted
             from solution
             where result = 4 and contest_id = ?
             group by pid1) p1 on problem.pid = p1.pid1
  left join (select
               problem_id pid2,
               num,
               count(1)   submit
             from solution
             where contest_id = ?
             group by pid2) p2 on problem.pid = p2.pid2
union all
select *
from (SELECT
        \`vjudge_problem\`.\`title\`      as \`title\`,
        \`vjudge_problem\`.\`problem_id\` as \`pid\`,
        source                        as source,
        contest_problem.num           as pnum
      FROM
        \`contest_problem\`, \`vjudge_problem\`
      WHERE \`contest_problem\`.\`problem_id\` = \`vjudge_problem\`.\`problem_id\`
            AND \`contest_problem\`.\`contest_id\` = ? AND \`contest_problem\`.\`oj_name\` = \`vjudge_problem\`.\`source\`
      ORDER BY \`contest_problem\`.\`num\`) vproblem
  left join (select
               problem_id pid1,
               num,
               count(1)   accepted
             from vjudge_solution
             where result = 4 and contest_id = ?
             group by num) vp1 on vproblem.pid = vp1.pid1 and vproblem.pnum = vp1.num
  left join (select
               problem_id pid2,
               num,
               count(1)   submit
             from vjudge_solution
             where contest_id = ?
             group by num) vp2 on vproblem.pid = vp2.pid2 and vproblem.pnum = vp2.num
order by pnum;`, [cid, cid, cid, cid, cid, cid]));
			}
			sqlQueue.push(cache_query(`select count(1) as cnt,problem_id,result from solution where 
			user_id = ? and contest_id = ?
and result <> 13
group by problem_id,result`, [req.session.user_id, cid]));
			let submission_data;
			[contest_general_detail, submission_data] = await Promise.all(sqlQueue);
			let browse_privilege = req.session.isadmin || req.session.contest_manager;
			let submission_map = {};
			for (let i of submission_data) {
				if (typeof submission_map[i.problem_id] === "undefined") {
					submission_map[i.problem_id] = {};
				}
				submission_map[i.problem_id].ac = submission_map[i.problem_id].ac || i.result === 4;
			}
			for (let i of contest_general_detail) {
				if (typeof submission_map[i.pid] !== "undefined") {
					if (submission_map[i.pid].ac) {
						i.ac = 1;
					}
					else {
						i.ac = -1;
					}
				}
				else {
					i.ac = 0;
				}
				if (!browse_privilege && !contest_is_end) {
					i.pid = i.pid1 = i.pid2 = "";
				}
			}
			delete contest_detail.password;
			res.json({
				status: "OK",
				data: contest_general_detail,
				info: contest_detail,
				admin: browse_privilege
			});
		}
	}
	catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

router.get("/list", async (req, res) => {
	let privilege = Boolean(req.session.isadmin);
	let sql = `select title,start_time,end_time,contest_id from contest ${privilege ? "" : " where defunct = 'N'"}`;
	const _data = await cache_query(sql);
	res.json({
		status: "OK",
		data: _data
	});
});

router.get("/statistics/:cid", async (req, res) => {
	let cid = req.params.cid === undefined || isNaN(req.params.cid) ? -1 : parseInt(req.params.cid);
	if (~cid && cid >= 1000) {
		const [contest_statistics_detail, total] = await Promise.all([
			cache_query(`SELECT
  \`result\`,
  \`num\`,
  \`language\`
FROM \`solution\`
WHERE \`contest_id\` = ? and num >= 0
union all SELECT
            \`result\`,
            \`num\`,
            \`language\`
          FROM \`vjudge_solution\`
          WHERE \`contest_id\` = ? and num >= 0`, [cid, cid])
			,
			cache_query("select count(1)total_problem,contest_id from contest_problem where contest_id = ?", [cid])
		])
        ;
		res.json({
			status: "OK",
			data: contest_statistics_detail,
			total: total[0].total_problem
		});
	}
	else {
		res.json(error.invalidParams);
	}
});

router.post("/password/:cid", async (req, res) => {
	let cid = req.params.cid === undefined || isNaN(req.params.cid) ? -1 : parseInt(req.params.cid);
	if (~cid && cid >= 1000) {
		const contest_detail = await cache_query("select * from contest where contest_id = ?", [cid]);
		if (contest_detail.length < 1) {
			res.json(error.invalidParams);
		}
		else {
			const password = contest_detail[0].password;
			const user_password = req.body.password;
			if (password.toString() === user_password.toString()) {
				req.session.contest[`c${cid}`] = true;
				res.json({
					status: "OK"
				});
			}
			else {
				res.json({
					status: "Wrong password"
				});
			}
		}
	}
	else {
		res.json(error.invalidParams);
	}
});

module.exports = ["/contest", auth, router];
