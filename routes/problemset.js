const express = require("express");
const query = require("../module/mysql_query");
const router = express.Router();
const page_cnt = 50;
let cache_pool = {};

async function cache_query(sql, sqlArr) {
	return cache_pool[sql.toString() + sqlArr.toString()] || await (cache_pool[sql.toString() + sqlArr.toString()] = query(sql, sqlArr));
}

router.get("/:start", async function (req, res) {
	const start = parseInt(req.params.start);
	let result;
	if (req.session.isadmin) {
		result = await cache_query(`select problem_id,title,source,submit,accepted,label from problem order by problem_id asc limit ?,?`,
			[start*50, page_cnt]);
	}
	else {
		result = await cache_query(`select problem_id,title,source,submit,accepted,label from problem
		where defunct='N' and problem_id not in(select problem_id from contest_problem
		where contest_id in (select contest_id from contest where defunct='N' and (end_time>NOW() or private=1))) order by problem_id asc
		 limit ?,?`,[start,page_cnt]);
	}
	let send_problem_list = [];
	for (let i of result) {
		send_problem_list.push({
			problem_id: i.problem_id,
			title: i.title,
			source: i.source,
			submit: i.submit,
			accepted: i.accepted,
			label: i.label
		});
	}
	res.json(send_problem_list);
});

module.exports = router;