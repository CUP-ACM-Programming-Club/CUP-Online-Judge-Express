const express = require("express");
//const query = require("../module/mysql_query");
const dayjs = require("dayjs");
const const_variable = require("../module/const_name");
const cache_query = require("../module/mysql_cache");
const router = express.Router();
const auth = require("../middleware/auth");

const page_cnt = 50;
const get_ranklist = async (req, res, opt = {}) => {
	let page = opt.page * 50;
	let result;
	if (!opt.search && !opt.time_stamp) {
		if (opt.vjudge) {
			result = await cache_query(`SELECT user_id,nick,vjudge_accept,vjudge_submit,avatar FROM users ORDER BY vjudge_accept
			 DESC,vjudge_submit DESC,reg_time LIMIT ?,?`, [page, page_cnt]);
		}
		else {
			result = await cache_query(`SELECT user_id,nick,solved,submit,vjudge_solved,avatar FROM users ORDER BY solved 
				DESC,submit,reg_time LIMIT ?,?`, [page, page_cnt]);
		}
	}
	else if (!opt.search) {
		let time_start;
		if (opt.time_stamp === "Y") {
			// time_start = new Date().getFullYear() + "-01-01";
			time_start = dayjs().subtract(1, "year").format("YYYY-MM-DD");
		}
		else if (opt.time_stamp === "M") {
			//time_start = new Date().getFullYear() + "-" + (new Date().getMonth() + 1) + "-01";
			time_start = dayjs().subtract(1, "month").format("YYYY-MM-DD");
		}
		else if (opt.time_stamp === "W") {
			//let _temp_date = new Date();
			//let week_time = new Date(0).setDate(_temp_date.getDay() + 1);
			//_temp_date = new Date(_temp_date - week_time);
			//time_start = _temp_date.getFullYear() + "-" + (_temp_date.getMonth() + 1) + "-" + (_temp_date.getDate());
			time_start = dayjs().subtract(1, "week").format("YYYY-MM-DD");
		}
		else if (opt.time_stamp === "D") {
			//time_start = new Date().getFullYear() + "-" + (new Date().getMonth() + 1) + "-" + new Date().getDate();
			time_start = dayjs().subtract(1, "day").format("YYYY-MM-DD");
		}
		else {
			time_start = "1970-01-01";
		}
		if (!opt.vjudge) {
			result = await cache_query(`SELECT users.user_id,users.avatar
		users.nick,s.solved,t.submit,v.solved as vjudge_solved,avatar FROM users
		RIGHT JOIN (SELECT count(distinct problem_id) solved,user_id
		FROM solution WHERE in_date >= ? AND result = 4 GROUP BY user_id
		ORDER BY solved DESC) s
		ON users.user_id = s.user_id
		LEFT JOIN
		(SELECT count(problem_id) submit,user_id FROM solution WHERE
		in_date >= ?
		GROUP BY user_id ORDER BY submit DESC
		) t
		ON users.user_id = t.user_id
		LEFT JOIN (SELECT count(distinct CONCAT(oj_name,problem_id)) solved,user_id
		FROM (select oj_name,problem_id,user_id,result FROM vjudge_solution
		WHERE in_date >= ?
		UNION ALL
		SELECT oj_name,problem_id,user_id,4 as result FROM vjudge_record
		WHERE time >= ?)
		vsol WHERE result = 4 GROUP BY user_id ORDER BY solved) v
		ON users.user_id = v.user_id
		ORDER BY s.solved DESC,t.submit,reg_time LIMIT ?,?`,
			[time_start, time_start, time_start, time_start, page, page_cnt]);
		}
		else {
			result = await cache_query(`SELECT users.user_id,users.avatar,
		users.nick,s.solved as vjudge_accept,t.submit as vjudge_submit FROM users
		RIGHT JOIN (SELECT count(distinct CONCAT(oj_name,problem_id)) solved,user_id
		FROM vjudge_solution WHERE in_date >= ? AND result = 4 GROUP BY user_id
		ORDER BY solved DESC) s
		ON users.user_id = s.user_id
		LEFT JOIN
		(SELECT count(CONCAT(oj_name,problem_id)) submit,user_id FROM vjudge_solution WHERE
		in_date >= ?
		GROUP BY user_id ORDER BY submit DESC
		) t
		ON users.user_id = t.user_id
		ORDER BY s.solved DESC,t.submit,reg_time LIMIT ?,?`,
			[time_start, time_start, page, page_cnt]);
		}
	}
	else if (!opt.time_stamp) {
		let search_name = `%${opt.search}%`;
		if (opt.vjudge) {
			result = await cache_query(`SELECT user_id,nick,vjudge_submit,vjudge_accept,avatar FROM users WHERE user_id 
		LIKE ? OR nick LIKE ? ORDER BY solved DESC,submit,user_id
		LIMIT ?,?`,
			[search_name, search_name, page, page_cnt]);
		}
		else {
			result = await cache_query(`SELECT user_id,nick,solved,vjudge_solved,submit,avatar FROM users WHERE user_id 
		LIKE ? OR nick LIKE ? ORDER BY solved DESC,submit,user_id
		LIMIT ?,?`,
			[search_name, search_name, page, page_cnt]);
		}
	}
	else {
		res.json({
			status: "error",
			statement: "invalid parameter"
		});
		return;
	}
	res.json({
		ranklist: result,
		_name: const_variable.language.cn.ranklist
	});
};

router.get("/", async function (req, res) {
	let page = req.query.page || 0;
	let search = req.query.search || "";
	let time_stamp = req.query.time_stamp;
	let vjudge = req.query.vjudge || false;
	await get_ranklist(req, res, {
		page: page,
		search: search,
		time_stamp: time_stamp,
		vjudge: vjudge
	});
});

router.get("/user", async function (req, res) {
	let result = await cache_query("SELECT count(1) as tot_user FROM users")
		.catch(() => {
			//console.log(errs);
			res.json({
				status: "error",
				statement: "database error"
			});
		});
	const tot_user = result[0].tot_user;
	result = await cache_query("SELECT count(1) as acm_user FROM acm_member");
	const acm_user = result[0].acm_user;
	result = {
		tot_user: tot_user,
		acm_user: acm_user
	};
	res.json([result]);
});

module.exports = ["/ranklist", auth, router];
