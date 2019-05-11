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
const query = require("../module/mysql_query");
const [error] = require("../module/const_var");
const auth = require("../middleware/auth");
const router = express.Router();
router.use(...require("./user"));
const check = async (req, res, cid) => {
	if (cid < 1000) {
		res.json(error.invalidParams);
		return false;
	}
	const contest = await cache_query("SELECT * FROM contest WHERE contest_id = ?", [cid]);
	const start_time = dayjs(contest[0].start_time);
	const now = dayjs();
	const privilege = req.session.isadmin || req.session.contest_maker[`m${cid}`];
	if (privilege) {
		return contest;
	}
	if (global.contest_mode) {
		if (!privilege) {
			if (parseInt(contest[0].cmod_visible) === 0) {
				res.json(error.contestMode);
				return false;
			}
		}
	} else {
		if (parseInt(contest[0].cmod_visible) === 1) {
			res.json(error.contestMode);
			return false;
		}
	}
	// req.session.contest[`c${cid}`]

	if (start_time.isAfter(now)) {
		res.json(error.contestNotStart);
		return false;
	} else if (parseInt(contest[0].private) === 1) {
		if (req.session.contest[`c${cid}`]) {
			return contest;
		} else {
			await require("../module/login_action")(req, req.session.user_id);
			if (req.session.contest[`c${cid}`]) {
				return contest;
			} else {
				res.json(error.noprivilege);
				return false;
			}
		}
	} else {
		return contest;
	}
};

function safeArrayParse(array) {
	if (typeof array !== "object" && !array.length) {
		return [];
	}
	return array.length ? array : Object.keys(array);
}

async function generateContestList(req) {
	let myContest = "1 = 1";
	if (req.query.myContest) {
		myContest = `(${safeArrayParse(req.session.contest_maker).concat(safeArrayParse(req.session.contest)).map(el => el.substring(1)).join(",")})`;
	}
	let admin_str = "1 = 1";
	if (!req.session.isadmin && !req.session.contest_manager) {
		admin_str = "ctest.defunct = 'N'";
	}
	if (global.contest_mode) {
		admin_str = `${admin_str} and ctest.cmod_visible = '${!req.session.isadmin ? 1 : 0}'`;
	}
	let base_sql = `select user_id,defunct,contest_id,cmod_visible,title,start_time,end_time,private from (select * from contest where start_time < NOW() and end_time>NOW())ctest left join (select user_id,rightstr from privilege where rightstr like 'm%') p on concat('m',contest_id)=rightstr where ${admin_str} and ${myContest} order by end_time asc limit 1000;`;
	let promiseArray = [cache_query(base_sql)];
	promiseArray.push(cache_query(`select user_id,defunct,contest_id,cmod_visible,title,start_time,end_time,private from (select * from contest where contest_id not in (select contest_id  from contest where start_time< NOW() and end_time > NOW()))ctest left join (select user_id,rightstr from privilege where rightstr like 'm%') p on concat('m',contest_id)=rightstr where ${admin_str} and ${myContest} order by contest_id desc limit 1000;`));
	const ret = (await Promise.all(promiseArray)).reduce((accumulator, currentValue) => accumulator.concat(currentValue));
	console.log(ret);
	return ret;
}

router.get("/general/:cid", async (req, res) => {
	let cid = req.params.cid === undefined || isNaN(req.params.cid) ? -1 : parseInt(req.params.cid);
	if (~cid && check(req, res, cid)) {
		const contest_general_detail = await cache_query(`select t1.contest_id,t1.title,t1.start_time,
		t1.end_time,t1.description,t1.cmod_visible,t2.total_problem from (select * from contest where contest_id = ?)t1
  left join (select count(1)total_problem,contest_id from contest_problem where contest_id = ?)t2
  on t1.contest_id = t2.contest_id`, [cid, cid]);
		if (contest_general_detail.length < 1) {
			res.json(error.invalidParams);
		} else {
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
			let contest_general_detail;
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

			} else {
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
			sqlQueue.push(cache_query("select limit_hostname from contest where contest_id = ?", [cid]));
			let submission_data;
			let limit_data;
			[contest_general_detail, submission_data, limit_data] = await Promise.all(sqlQueue);
			let browse_privilege = req.session.isadmin || req.session.contest_manager;
			let submission_map = {};
			for (let i of submission_data) {
				if (typeof submission_map[i.problem_id] === "undefined") {
					submission_map[i.problem_id] = {};
				}
				submission_map[i.problem_id].ac = submission_map[i.problem_id].ac || i.result === 4;
			}
			for (let i of contest_general_detail) {
				if (typeof submission_map[i.pid + ""] !== "undefined") {
					if (submission_map[i.pid + ""].ac) {
						i.ac = 1;
					} else {
						i.ac = -1;
					}
				} else {
					i.ac = 0;
				}
			}
			if (!browse_privilege && !contest_is_end) {
				contest_general_detail = JSON.parse(JSON.stringify(contest_general_detail));
				for (let i of contest_general_detail) {
					i.pid = i.pid1 = i.pid2 = "";
				}
			}
			console.log(limit_data);
			delete contest_detail.password;
			res.json({
				status: "OK",
				data: contest_general_detail,
				info: contest_detail,
				admin: browse_privilege,
				limit: limit_data[0].limit_hostname,
				contest_mode: global.contest_mode
			});
		}
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

router.get("/list", async (req, res) => {
	res.json({
		status: "OK",
		data: await generateContestList(req)
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
	} else {
		res.json(error.invalidParams);
	}
});

router.post("/password/:cid", async (req, res) => {
	let cid = req.params.cid === undefined || isNaN(req.params.cid) ? -1 : parseInt(req.params.cid);
	if (~cid && cid >= 1000) {
		const contest_detail = await cache_query("select * from contest where contest_id = ?", [cid]);
		if (contest_detail.length < 1) {
			res.json(error.invalidParams);
		} else {
			const password = contest_detail[0].password;
			const user_password = req.body.password;
			if (password && password.length > 0 && password.toString() === user_password.toString()) {
				req.session.contest[`c${cid}`] = true;
				res.json({
					status: "OK"
				});
				query("select * from privilege where user_id = ? and rightstr = ?", [req.session.user_id, `c${cid}`])
					.then(rows => (rows.length === 0) ?
						query("insert into privilege(user_id,rightstr)values(?,?)", [req.session.user_id, `c${cid}`]) : false
					);
			} else {
				res.json(error.errorMaker("Wrong password"));
			}
		}
	} else {
		res.json(error.invalidParams);
	}
});

module.exports = ["/contest", auth, router];
