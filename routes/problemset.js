const express = require("express");
const query = require("../module/mysql_query");
const router = express.Router();
const page_cnt = 50;
let cache_pool = {};

async function cache_query(sql, sqlArr = []) {
	let identified = sql.toString() + sqlArr.toString();
	if (cache_pool[identified]) {
		query(sql, sqlArr)
			.then(resolve => {
				cache_pool[identified] = resolve;
			})
			.catch(err => {
			});
		return cache_pool[identified];
	}
	else {
		return (cache_pool[identified] = await query(sql, sqlArr));
	}
}

async function get_problem(req, res) {
	const start = parseInt(req.params.start);
	let search = req.params.search;
	if (search) {
		search = `%${search}%`;
	}
	let result;
	if (req.session.isadmin) {
		if (search) {
			result = await cache_query(`select problem_id,title,source,submit,accepted,label from problem
			where title like ? or description like ? or input like ? or output like ? or problem_id like ?
			or source like ? or label like ? order by problem_id asc limit ?,?`,
				[search, search, search, search, search, search, search, start * 50, page_cnt]);
		}
		else {
			result = await cache_query(`select problem_id,title,source,submit,accepted,label from problem order by problem_id asc limit ?,?`,
				[start * 50, page_cnt]);
		}
	}
	else {
		if (search) {
			result = await cache_query(`select problem_id,title,source,submit,accepted,label from problem
			where defunct='N' and (title like ? or description like ? or input like ? or output like ? or problem_id like ?
			or source like ? or label like ?) and problem_id not in(select problem_id from contest_problem
			where contest_id in (select contest_id from contest where defunct='N' and (end_time>NOW() or private=1))) order by problem_id asc
		 	limit ?,?`, [search, search, search, search, search, search, search, start, page_cnt]);
		}
		else {
			result = await cache_query(`select problem_id,title,source,submit,accepted,label from problem
			where defunct='N' and problem_id not in(select problem_id from contest_problem
			where contest_id in (select contest_id from contest where defunct='N' and (end_time>NOW() or private=1))) order by problem_id asc
		 	limit ?,?`, [start, page_cnt]);
		}
	}
	let send_problem_list = [];
	for (let i of result) {
		let acnum = await cache_query(`select count(1) as cnt from solution where user_id=? and problem_id = ?
		and result=4`, [req.session.user_id, i.problem_id]);
		send_problem_list.push({
			problem_id: i.problem_id,
			ac: parseInt(acnum[0].cnt) > 0,
			title: i.title,
			source: i.source,
			submit: i.submit,
			accepted: i.accepted,
			label: i.label
		});
	}
	result = await cache_query("select value from global_setting where label='label_color'");
	res.json({
		problem: send_problem_list,
		color: JSON.parse(result[0].value)
	});
}

router.get("/:start", async function (req, res) {
	await get_problem(req, res);
});

router.get("/:start/:search", async function (req, res) {
	await get_problem(req, res);
});

module.exports = router;