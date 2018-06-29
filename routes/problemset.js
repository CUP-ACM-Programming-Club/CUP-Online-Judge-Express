const express = require("express");
const query = require("../module/mysql_query");
const router = express.Router();
const dayjs = require("dayjs");
const page_cnt = 50;
let cache_pool = {};
const auth = require("../middleware/auth");

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
	const target = req.query.source || "local";
	let search_table = target === "local" ? "problem" : target === "virtual" ? "vjudge_problem" : "problem";
	const start = parseInt(req.params.start);
	let search = req.params.search;
	if (search === "none") {
		search = false;
	}
	let label = req.query.label;
	if (typeof label !== "string") {
		label = false;
	}
	const _from = req.query.from || "";
	let from = undefined;
	if (_from && _from.length >= 3 && _from.length <= 6) {
		from = _from;
	}
	const has_from = from !== undefined;
	let order = req.params.order || "problem_id";
	let rule = req.params.order_rule || 0;
	order = order_rule(order, sort_string(rule));
	if (search) {
		search = `%${search}%`;
	}
	let result;
	let total_num;
	let _total;
	let recent_one_month;
	let one_month_add_problem = undefined;
	const one_month_ago = dayjs().subtract(1, "month").format("YYYY-MM-DD");
	const browse_privilege = req.session.isadmin || req.session.source_browser || req.session.editor;
	if (browse_privilege) {
		if (search) {
			let sqlArr = [search, search, search, search, search, search, has_from ? from : search];
			if (label) {
				sqlArr.push(`%${label}%`);
			}
			sqlArr.push(start * page_cnt, page_cnt);
			[_total, result] = await Promise.all([cache_query(`select count(1) as cnt from ${search_table}
			where ((title like ? or description like ? or input like ? or output like ? or problem_id like ?
			 or label like ?) ${has_from ? "and source = ?" : "or source like ?"}) ${label ? "and label like ?" : ""}
			 `, sqlArr),
			cache_query(`select problem_id,in_date,title,source,submit,accepted,label from ${search_table}
			where ((title like ? or description like ? or input like ? or output like ? or problem_id like ?
			 or label like ?) ${has_from ? "and source = ?" : "or source like ?"} ) ${label ? "and label like ?" : ""}
			order by ${order} limit ?,?`, sqlArr)]);
		}
		else {
			let sqlArr = [];
			if (has_from) {
				sqlArr.push(from);
			}
			if (label) {
				sqlArr.push(`%${label}%`);
			}
			sqlArr.push(start * page_cnt, page_cnt);
			const sqlState = () => {
				const where = (has_from || label) ? "where" : "";
				let statmentArr = [];
				if (has_from) {
					statmentArr.push("source = ?");
				}
				if (label) {
					statmentArr.push("label like ?");
				}
				return where + " " + statmentArr.join(" and ");
			};
			let promiseArray = [cache_query(`select count(1) as cnt from ${search_table} ${sqlState()}`,
				sqlArr), cache_query(`select problem_id,title,source,submit,accepted,in_date,label from ${search_table} 
			${sqlState()} order by ${order} limit ?,?`, sqlArr)];
			if (!has_from && !label) {
				promiseArray.push(cache_query(`select count(1) as cnt from ${search_table} where 
			    in_date > ${one_month_ago}`));
			}
			[_total, result, recent_one_month] = await Promise.all(promiseArray);
		}
	}
	else {
		if (search) {
			let sqlArr = [search, search, search, search, search, search, has_from ? from : search];
			if (label) {
				sqlArr.push(`%${label}%`);
			}
			sqlArr.push(start * page_cnt, page_cnt);
			[_total, result] = await Promise.all([cache_query(`select count(1) as cnt from ${search_table}
			where defunct='N' and ((title like ? or description like ? or input like ? or output like ? or problem_id like ?
			or label like ?) ${has_from ? "and source = ?" : "or source like ?"}) ${label ? "and label like ?" : ""}
			 and problem_id not in(select problem_id from contest_problem
			where contest_id in (select contest_id from contest where (end_time>NOW() or private=1))) 
			`, sqlArr),
			cache_query(`select problem_id,in_date,title,source,submit,accepted,label from ${search_table}
			where defunct='N' and ((title like ? or description like ? or input like ? or output like ? or problem_id like ?
			or label like ?) ${has_from ? "and source = ?" : "or source like ?"}) ${label ? "and label like ?" : ""} and problem_id not in(select problem_id from contest_problem
			where contest_id in (select contest_id from contest where (end_time>NOW() or private=1))) 
			order by ${order}
		 	limit ?,?`, sqlArr)]);
		}
		else {
			let sqlArr = [];
			if (has_from) {
				sqlArr.push(from);
			}
			if (label) {
				sqlArr.push(`%${label}%`);
			}
			sqlArr.push(start * page_cnt, page_cnt);
			let promiseArray = [cache_query(`select count(1) as cnt from ${search_table}
			where defunct='N' ${has_from ? "and source = ?" : ""} ${label ? "and label like ?" : ""} and problem_id not in(select problem_id from contest_problem
			where oj_name is null and contest_id in (select contest_id from contest where (end_time>NOW() or private=1))) 
			`, sqlArr),
			cache_query(`select problem_id,in_date,title,source,submit,accepted,label from ${search_table}
			where defunct='N' ${has_from ? "and source = ?" : ""} ${label ? "and label like ?" : ""} and problem_id not in(select problem_id from contest_problem
			where oj_name is null and contest_id in (select contest_id from contest where (end_time>NOW() or private=1))) 
			order by ${order}
		 	limit ?,?`, sqlArr)];
			if (!has_from && !label) {
				promiseArray.push(cache_query(`select count(1) as cnt from problem where defunct='N' and in_date > ${one_month_ago}
			    and problem_id not in (select problem_id from contest_problem
			where oj_name is null and contest_id in (select contest_id from contest where (end_time>NOW() or private=1)))`));
			}
			[_total, result, recent_one_month] = await Promise.all(promiseArray);
		}
	}
	total_num = parseInt(_total[0].cnt);
	if (recent_one_month && recent_one_month.length > 0) {
		one_month_add_problem = recent_one_month[0].cnt;
	}
	let send_problem_list = [];
	for (let i of result) {
		let acnum;
		if (target === "local") {
			acnum = await cache_query(`select count(1) as cnt from solution where user_id=? and problem_id = ?
		and result=4 union all select count(1) as cnt from solution where user_id=? and problem_id=?`,
			[req.session.user_id, i.problem_id, req.session.user_id, i.problem_id]);
		}
		else {
			acnum = await cache_query(`select count(1) as cnt from vjudge_solution where user_id = ? and problem_id = ?
			and oj_name = ? and result = 4 union all select count(1) as cnt from vjudge_solution where user_id = ? 
			and oj_name = ? and problem_id = ?`, [req.session.user_id, i.problem_id, i.source, req.session.user_id,
				i.source, i.problem_id]);
		}
		let ac = parseInt(acnum[0].cnt);
		let submit = parseInt(acnum[1].cnt);
		send_problem_list.push({
			problem_id: i.problem_id,
			ac: parseInt(ac) > 0 ? true : parseInt(submit) > 0 ? false : -1,
			title: i.title,
			source: i.source,
			submit: i.submit,
			accepted: i.accepted,
			label: i.label,
			new: dayjs(i.in_date).isAfter(one_month_ago)
		});
	}
	result = await cache_query("select value from global_setting where label='label_color'");
	let send_target = {
		problem: send_problem_list,
		color: JSON.parse(result[0].value),
		total: total_num,
		recent_one_month: one_month_add_problem,
		step: page_cnt
	};
	if (search_table === "vjudge_problem") {
		send_target.from = await new Promise(resolve => {
			cache_query("select name from vjudge_source")
				.then(rows => {
					let source = [];
					for (let i of rows) {
						source.push(i.name);
					}
					resolve(source);
				});
		});
	}
	res.json(send_target);
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

module.exports = ["/problemset", auth, router];
