const express = require("express");
const query = require("../module/mysql_query");
const router = express.Router();
const page_cnt = 50;
let cache_pool = {};

function sort_string(sort) {
	const _sort = ["asc", "desc"];
	return _sort[sort] || "asc";
}


function order_rule(order, sort) {
	const _order_rule = {
		"submit": `submit ${sort}`,
		"accepted": `accepted ${sort}`,
		"present": `accepted/submit ${sort},submit ${sort}`,
		"problem_id": `problem_id ${sort}`
	};
	return _order_rule[order] || "problem_id asc";
}

async function cache_query(sql, sqlArr = []) {
	let identified = sql.toString() + sqlArr.toString();
	if (cache_pool[identified]) {
		query(sql, sqlArr)
			.then(resolve => {
				cache_pool[identified] = resolve;
			})
			.catch(() => {
			});
		return cache_pool[identified];
	}
	return (cache_pool[identified] = await query(sql, sqlArr));
}

async function get_problem(req, res) {
	const start = parseInt(req.params.start);
	let search = req.params.search;
	if (search === "none") {
		search = false;
	}
	let order = req.params.order || "problem_id";
	let rule = req.params.order_rule || 0;
	order = order_rule(order, sort_string(rule));
	if (search) {
		search = `%${search}%`;
	}
	let result;
	let total_num;
	let _total;
	if (req.session.isadmin) {
		if (search) {
			_total = await cache_query(`select count(1) as cnt from problem
			where title like ? or description like ? or input like ? or output like ? or problem_id like ?
			or source like ? or label like ? order by ${order}`,[search, search, search, search, search, search, search]);
			result = await cache_query(`select problem_id,title,source,submit,accepted,label from problem
			where title like ? or description like ? or input like ? or output like ? or problem_id like ?
			or source like ? or label like ? order by ${order} limit ?,?`,
			[search, search, search, search, search, search, search, start * 50, page_cnt]);
		}
		else {
			_total = await cache_query(`select count(1) as cnt from problem order by ${order}`);
			result = await cache_query(`select problem_id,title,source,submit,accepted,label from problem order by ${order} limit ?,?`,
				[start * 50, page_cnt]);
		}
	}
	else {
		if (search) {
			_total = await cache_query(`select count(1) as cnt from problem
			where defunct='N' and (title like ? or description like ? or input like ? or output like ? or problem_id like ?
			or source like ? or label like ?) and problem_id not in(select problem_id from contest_problem
			where contest_id in (select contest_id from contest where (end_time>NOW() or private=1))) 
			order by ${order}`, [search, search, search, search, search, search, search]);
			result = await cache_query(`select problem_id,title,source,submit,accepted,label from problem
			where defunct='N' and (title like ? or description like ? or input like ? or output like ? or problem_id like ?
			or source like ? or label like ?) and problem_id not in(select problem_id from contest_problem
			where contest_id in (select contest_id from contest where (end_time>NOW() or private=1))) 
			order by ${order}
		 	limit ?,?`, [search, search, search, search, search, search, search, start*50, page_cnt]);
		}
		else {
			_total = await cache_query(`select count(1) as cnt from problem
			where defunct='N' and problem_id not in(select problem_id from contest_problem
			where oj_name is null and contest_id in (select contest_id from contest where (end_time>NOW() or private=1))) 
			order by ${order}`);
			result = await cache_query(`select problem_id,title,source,submit,accepted,label from problem
			where defunct='N' and problem_id not in(select problem_id from contest_problem
			where oj_name is null and contest_id in (select contest_id from contest where (end_time>NOW() or private=1))) 
			order by ${order}
		 	limit ?,?`, [start*50, page_cnt]);
		}
	}
	total_num = parseInt(_total[0].cnt);
	let send_problem_list = [];
	for (let i of result) {
		let acnum = await cache_query(`select count(1) as cnt from solution where user_id=? and problem_id = ?
		and result=4 union all select count(1) as cnt from solution where user_id=? and problem_id=?`,
		[req.session.user_id, i.problem_id,req.session.user_id,i.problem_id]);
		let ac = parseInt(acnum[0].cnt);
		let submit = parseInt(acnum[1].cnt);
		send_problem_list.push({
			problem_id: i.problem_id,
			ac: parseInt(ac) > 0 ? true : parseInt(submit) > 0 ? false : -1,
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
		color: JSON.parse(result[0].value),
		total:total_num,
		step:page_cnt
	});
}

router.get("/:start", async function (req, res) {
	await get_problem(req, res);
});

router.get("/:start/:search", async function (req, res) {
	await get_problem(req, res);
});

router.get("/:start/:search/:order", async function (req, res) {
	await get_problem(req, res);
});

router.get("/:start/:search/:order/:order_rule", async function (req, res) {
	await get_problem(req, res);
});

module.exports = router;