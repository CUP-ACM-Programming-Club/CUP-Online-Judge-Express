const express = require("express");
const cache_query = require("../module/mysql_cache");
const router = express.Router();
const dayjs = require("dayjs");
const page_cnt = 50;
const [error] = require("../module/const_var");
const auth = require("../middleware/auth");
const Interceptor = require("../module/problemset/interceptor");
const ProblemSetCachePool = require("../module/problemset/ProblemSetCachePool");
const NONE_PRIVILEGE_AND_SQL = ` and problem_id not in(select problem_id from contest_problem
			where oj_name is null and contest_id in (select contest_id from contest where (end_time>NOW() or private=1))) `;


function sort_string(sort) {
	const _sort = ["asc", "desc"];
	return _sort[sort] || "asc";
}

const checkPrivilege = (req) => {
	return req.session.isadmin || req.session.source_browser;
};

function makeCacheKey(req) {
	const params = req.params;
	const query = req.query;
	const privilegeKey = `admin:${req.session.isadmin} source_browser:${req.session.source_browser}`;
	let paramKey = "", queryKey = "";
	for(const key in params) {
		if (Object.prototype.hasOwnProperty.call(params, key)) {
			paramKey += `${key}: ${params[key]}`;
		}
	}
	for(const key in query) {
		if (Object.prototype.hasOwnProperty.call(query, key)) {
			queryKey += `${key}: ${query[key]}`;
		}
	}
	return `${paramKey},${queryKey},${privilegeKey}`;
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

async function searchHandler(val = {}, normal = false) {
	let {search, label, has_from, from, start, search_table, order} = val;
	let sqlArr = [search, search, search, search, search, search, has_from ? from : search];
	if (label) {
		sqlArr.push(`%${label}%`);
	}
	sqlArr.push(start * page_cnt, page_cnt);
	return await Promise.all([cache_query(`select count(1) as cnt from ${search_table}
			where ((title like ? or description like ? or input like ? or output like ? or problem_id like ?
			or label like ?) ${has_from ? "and source = ?" : "or source like ?"}) ${label ? "and label like ?" : ""}
			${normal ? `and defunct='N' ${NONE_PRIVILEGE_AND_SQL}` : ""}
			`, sqlArr),
	cache_query(`select problem_id,in_date,title,source,submit,accepted,label from ${search_table}
			where ((title like ? or description like ? or input like ? or output like ? or problem_id like ?
			or label like ?) ${has_from ? "and source = ?" : "or source like ?"}) ${label ? "and label like ?" : ""}
			${normal ? `and defunct='N' ${NONE_PRIVILEGE_AND_SQL}` : ""}
			order by ${order}
		 	limit ?,?`, sqlArr)]);
}


async function get_problem(req, res) {
	try {
		const cacheKey = makeCacheKey(req);
		const cache = await ProblemSetCachePool.get(cacheKey);
		if (cache) {
			res.json(cache.data);
		}
		else {
			const target = req.query.source || "local";
			if (!checkPrivilege(req)) {
				if (global.contest_mode) {
					res.json(error.contestMode);
					return;
				}
			}
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
			let result, total_num, _total, recent_one_month, one_month_add_problem = undefined;
			const one_month_ago = dayjs().subtract(1, "month").format("YYYY-MM-DD");
			const browse_privilege = req.session.isadmin || req.session.source_browser || req.session.editor;
			if (browse_privilege) {
				if (search) {
					[_total, result] = await searchHandler({search, label, has_from, from, start, search_table, order});
				} else {
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
			    in_date > '${one_month_ago}'`));
					}
					[_total, result, recent_one_month] = await Promise.all(promiseArray);
				}
			} else {
				if (search) {
					[_total, result] = await searchHandler({
						search,
						label,
						has_from,
						from,
						start,
						search_table,
						order
					}, true);
				} else {
					let sqlArr = [];
					if (has_from) {
						sqlArr.push(from);
					}
					if (label) {
						sqlArr.push(`%${label}%`);
					}
					sqlArr.push(start * page_cnt, page_cnt);
					let promiseArray = [cache_query(`select count(1) as cnt from ${search_table}
			where defunct='N' ${has_from ? "and source = ?" : ""} ${label ? "and label like ?" : ""} ${NONE_PRIVILEGE_AND_SQL}
			`, sqlArr),
					cache_query(`select problem_id,in_date,title,source,submit,accepted,label from ${search_table}
			where defunct='N' ${has_from ? "and source = ?" : ""} ${label ? "and label like ?" : ""} ${NONE_PRIVILEGE_AND_SQL}
			order by ${order}
		 	limit ?,?`, sqlArr)];
					if (!has_from && !label) {
						promiseArray.push(cache_query(`select count(1) as cnt from problem where defunct='N' and in_date > ${one_month_ago}
			    ${NONE_PRIVILEGE_AND_SQL}`));
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
				} else {
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
				send_target.from = (await cache_query("select name from vjudge_source")).map(val => val.name);
			}
			ProblemSetCachePool.set(cacheKey, send_target);
			res.json(send_target);
		}
	}
	catch (e) {
		console.log(e);
		res.json(error.internalError);
	}
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

module.exports = ["/problemset", auth, Interceptor, router];
