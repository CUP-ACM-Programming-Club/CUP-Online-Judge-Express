const express = require("express");
const dayjs = require("dayjs");
const const_variable = require("../module/const_name");
const cache_query = require("../module/mysql_cache");
const [error] = require("../module/const_var");
const router = express.Router();
import auth from "../middleware/auth";

const page_cnt = 50;

function generateMemberSql(opt: any = {}) {
	if (typeof opt !== "object") {
		return "";
	}
	else if (opt.acm_member === true) {
		return " user_id in (select user_id from acm_member where level = 1) and";
	}
	else if (opt.retired_member === true) {
		return " user_id in (select user_id from acm_member where level = 2) and";
	}
	else {
		return "";
	}
}

function parseQuery(req: any) {
	return {
		page: req.query.page || 0,
		search: req.query.search || "",
		time_stamp: req.query.time_stamp,
		vjudge: req.query.vjudge || false
	};
}

const get_ranklist = async (req: any, res: any, opt: any = {}) => {
	let page = opt.page * 50;
	let result;
	try {
		if (!opt.search && !opt.time_stamp) {
			if (opt.vjudge) {
				result = await cache_query(`SELECT user_id,nick,biography,vjudge_accept,vjudge_submit,avatar,avatarUrl,email FROM users where
                 ${generateMemberSql(opt)} school != 'your_own_school' ORDER BY vjudge_accept
                 DESC,vjudge_submit DESC,reg_time LIMIT ?,?`, [page, page_cnt]);
			} else {
				result = await cache_query(`SELECT user_id,biography,nick,solved,submit,vjudge_solved,avatar,avatarUrl,email FROM users where
                ${generateMemberSql(opt)} school != 'your_own_school' ORDER BY solved 
                    DESC,submit,reg_time LIMIT ?,?`, [page, page_cnt]);
			}
		} else if (!opt.search) {
			let time_start;
			if (opt.time_stamp === "Y") {
				time_start = dayjs().subtract(1, "year").format("YYYY-MM-DD");
			} else if (opt.time_stamp === "M") {
				time_start = dayjs().subtract(1, "month").format("YYYY-MM-DD");
			} else if (opt.time_stamp === "W") {
				time_start = dayjs().subtract(1, "week").format("YYYY-MM-DD");
			} else if (opt.time_stamp === "D") {
				time_start = dayjs().subtract(1, "day").format("YYYY-MM-DD");
			} else {
				time_start = "1970-01-01";
			}
			if (!opt.vjudge) {
				// Optimization: Fetch raw data and aggregate in application to avoid heavy DB temporary files
				// and compatibility issues with some SQL modes or mock DBs.
				const solutions = await cache_query(`
                    SELECT user_id, problem_id
                    FROM solution 
                    WHERE in_date >= ? AND result = 4`, [time_start]);

				if (solutions && solutions.length > 0) {
					const stats: any = {};
					for (const sol of solutions) {
						if (!stats[sol.user_id]) {
							stats[sol.user_id] = new Set();
						}
						stats[sol.user_id].add(sol.problem_id);
					}

					const sortedUsers = Object.keys(stats).map(uid => ({
						user_id: uid,
						solved: stats[uid].size
					})).sort((a, b) => b.solved - a.solved).slice(page, page + page_cnt);

					const userIds = sortedUsers.map(u => u.user_id);
					const users = await cache_query(`SELECT user_id, nick, biography, email, avatar, avatarUrl 
                        FROM users WHERE user_id IN (?)`, [userIds]);

					const userMap = new Map();
					users.forEach((u: any) => userMap.set(u.user_id, u));

					result = sortedUsers.map((s) => {
						const user = userMap.get(s.user_id);
						return {
							...user,
							solved: s.solved,
						};
					});
				} else {
					result = [];
				}
			} else {
				// Vjudge optimization (In-memory aggregation)
				const solutions = await cache_query(`
                    SELECT user_id, CONCAT(oj_name,problem_id) as problem_hash
                    FROM vjudge_solution 
                    WHERE in_date >= ? AND result = 4`, [time_start]);

				if (solutions && solutions.length > 0) {
					const stats: any = {};
					for (const sol of solutions) {
						if (!stats[sol.user_id]) {
							stats[sol.user_id] = new Set();
						}
						stats[sol.user_id].add(sol.problem_hash);
					}

					const sortedUsers = Object.keys(stats).map(uid => ({
						user_id: uid,
						solved: stats[uid].size
					})).sort((a, b) => b.solved - a.solved).slice(page, page + page_cnt);

					const userIds = sortedUsers.map(u => u.user_id);
					const users = await cache_query(`SELECT user_id, nick, biography, email, avatar, avatarUrl 
                        FROM users WHERE user_id IN (?)`, [userIds]);

					const userMap = new Map();
					users.forEach((u: any) => userMap.set(u.user_id, u));

					// For VJudge submit count
					const submits = await cache_query(`
                        SELECT user_id
                        FROM vjudge_solution 
                        WHERE in_date >= ? AND user_id IN (?)`, [time_start, userIds]);

					const submitStats: any = {};
					for (const sub of submits) {
						if (!submitStats[sub.user_id]) submitStats[sub.user_id] = 0;
						submitStats[sub.user_id]++;
					}

					result = sortedUsers.map((s) => {
						const user = userMap.get(s.user_id);
						return {
							...user,
							vjudge_accept: s.solved,
							vjudge_submit: submitStats[s.user_id] || 0
						};
					});
				} else {
					result = [];
				}
			}
		} else if (!opt.time_stamp) {
			let search_name = `%${opt.search}%`;
			if (opt.vjudge) {
				result = await cache_query(`SELECT user_id,nick,biography,vjudge_submit,vjudge_accept,avatar,avatarUrl,email FROM users WHERE user_id
            LIKE ? OR nick LIKE ? ORDER BY solved DESC,submit,user_id
            LIMIT ?,?`,
					[search_name, search_name, page, page_cnt]);
			} else {
				result = await cache_query(`SELECT user_id,nick,biography,solved,vjudge_solved,submit,avatar,avatarUrl,email FROM users WHERE user_id
            LIKE ? OR nick LIKE ? ORDER BY solved DESC,submit,user_id
            LIMIT ?,?`,
					[search_name, search_name, page, page_cnt]);
			}
		} else {
			res.json(error.errorMaker("invalid parameter"));
			return;
		}
		res.json({
			ranklist: result,
			_name: const_variable.language.cn.ranklist
		});
	} catch (e) {
		console.error("Ranklist Error:", e);
		res.json(error.database);
	}
};

router.get("/", async function (req: any, res: any) {
	await get_ranklist(req, res, parseQuery(req));
});

router.get("/acmmember", async function (req: any, res: any) {
	await get_ranklist(req, res, Object.assign(parseQuery(req), { acm_member: true }));
});

router.get("/oldmember", async function (req: any, res: any) {
	await get_ranklist(req, res, Object.assign(parseQuery(req), { retired_member: true }));
});

router.get("/user", async function (req: any, res: any) {
	try {
		let [result1, result2] = await Promise.all([cache_query("SELECT count(1) as tot_user FROM users where school != 'your_own_school'"), cache_query("SELECT count(1) as acm_user FROM acm_member")]);
		res.json([{
			tot_user: result1[0].tot_user,
			acm_user: result2[0].acm_user
		}]);
	}
	catch (e) {
		res.json(error.database);
		console.log(e);
	}
});

const startRoute: any = ["/ranklist", auth, router];
startRoute.get_ranklist = get_ranklist;

export = startRoute;
