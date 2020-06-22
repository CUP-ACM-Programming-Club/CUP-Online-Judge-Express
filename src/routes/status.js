/* eslint-disable no-unused-vars */
import ContestAssistantManager from "../manager/contest/ContestAssistantManager";
import SourcePrivilegeCache from "../manager/submission/SourcePrivilegeCache";

const ENVIRONMENT = process.env.NODE_ENV || "prod";
const TEST_MODE = ENVIRONMENT.toLowerCase().indexOf("test") !== -1;
const express = require("express");
const router = express.Router();
const query = require("../module/mysql_query");
const cache_query = require("../module/mysql_cache");
const escape = require("escape-html");
const log4js = require("../module/logger");
const logger = log4js.logger("cheese", "info");
const const_name = require("../module/const_name");
const timediff = require("timediff");
const auth = require("../middleware/auth");
const [error] = require("../module/const_var");
const admin_auth = require("../middleware/admin");

router.use("/result", require("./status/submit_result"));
router.use("/device", require("./status/device"));
router.use("/sim", require("./status/sim"));
router.use("/runtimeerror", require("./status/runtime_error"));
router.use("/submit_hour", require("./status/submit_hour"));
router.use(...require("./status/ban_submission"));
router.use("/rejudge", admin_auth, require("./status/rejudge"));
router.use(...require("./status/compile_info"));
router.use(...require("./status/runtime_info"));
router.use(...require("./status/ip"));
router.use(...require("./status/problem"));

const SECONDS = 1000;
const MINUTES = 60 * SECONDS;
const HOURS = 60 * MINUTES;
const DAYS = 24 * HOURS;
const WEEKS = 7 * DAYS;
const MONTH = 30 * DAYS;
const YEARS = 365 * DAYS;
const NOT_EQUAL = 1;
const EQUAL = 0;
const LESS_OR_EQUAL = 2;
const GREATER_OR_EQUAL = 3;
const GREATER = 4;
const LESSER = 5;
const compareSymbol = ["!=", "=", "<=", ">=", ">", "<"];

function isCompareFlag(flag) {
	return flag >= 0 && flag <= 5;
}

const graphDataSql = [`SELECT sub.year,sub.month,sub.cnt as submit,accept.cnt as accepted
 FROM (SELECT count(1) as cnt,YEAR(in_date) as year,
              MONTH(in_date) as month
       FROM solution
       WHERE contest_id = ?
       GROUP BY YEAR(in_date),MONTH(in_date)
       UNION ALL
       SELECT count(1) as cnt,YEAR(in_date) as year,
              MONTH(in_date) as month
       FROM vjudge_solution
       WHERE contest_id = ?
       GROUP BY YEAR(in_date),MONTH(in_date)) sub
        LEFT JOIN
      (SELECT count(1) as cnt,YEAR(in_date) as year,MONTH(in_date) as month
       FROM solution
       WHERE result = 4
         AND contest_id = ?
       GROUP BY YEAR(in_date),MONTH(in_date)
       UNION ALL
       SELECT count(1) as cnt,YEAR(in_date) as year,MONTH(in_date) as month
       FROM vjudge_solution
       WHERE result = 4
         AND contest_id = ?
       GROUP BY YEAR(in_date),MONTH(in_date)) accept
      ON sub.year = accept.year AND sub.month = accept.month`, `SELECT sub.year,sub.month,sub.day,sub.cnt as submit,accept.cnt as accepted
 FROM (SELECT count(1) as cnt,YEAR(in_date) as year,MONTH(in_date) as month,
              DATE_FORMAT(in_date, "%d") as day
       FROM solution
       WHERE contest_id = ?
       GROUP BY MONTH(in_date),DATE_FORMAT(in_date, "%d")
       UNION ALL
       SELECT count(1) as cnt,YEAR(in_date) as year,MONTH(in_date) as month,
              DATE_FORMAT(in_date, "%d") as day
       FROM vjudge_solution
       WHERE contest_id = ?
       GROUP BY MONTH(in_date),DATE_FORMAT(in_date, "%d")) sub
        LEFT JOIN
      (SELECT count(1) as cnt,YEAR(in_date) as year,MONTH(in_date) as month,
              DATE_FORMAT(in_date, "%d") as day
       FROM solution
       WHERE result = 4
         AND contest_id = ?
       GROUP BY MONTH(in_date),DATE_FORMAT(in_date, "%d")
       UNION ALL
       SELECT count(1) as cnt,YEAR(in_date) as year,MONTH(in_date) as month,
              DATE_FORMAT(in_date, "%d") as day
       FROM vjudge_solution
       WHERE result = 4
         AND contest_id = ?
       GROUP BY MONTH(in_date),DATE_FORMAT(in_date, "%d")) accept
      ON sub.month = accept.month AND sub.day = accept.day AND
         sub.year = accept.year
 ORDER BY sub.year,sub.month,sub.day`,
`SELECT sub.year,sub.month,sub.day,sub.hour,sub.cnt as submit,accept.cnt as accepted
 FROM (SELECT count(1) as cnt,
              YEAR(in_date) as year,
              MONTH(in_date) as month,
              DATE_FORMAT(in_date, "%d") as day,
              HOUR(in_date) as hour
       FROM solution
       WHERE contest_id = ?
       GROUP BY DATE_FORMAT(in_date, "%d"),HOUR(in_date)
       UNION ALL
       SELECT count(1) as cnt,
              YEAR(in_date) as year,
              MONTH(in_date) as month,
              DATE_FORMAT(in_date, "%d") as day,
              HOUR(in_date) as hour
       FROM vjudge_solution
       WHERE contest_id = ?
       GROUP BY DATE_FORMAT(in_date, "%d"),HOUR(in_date)) sub
        LEFT JOIN
      (SELECT count(1) as cnt,
              YEAR(in_date) as year,
              MONTH(in_date) as month,
              DATE_FORMAT(in_date, "%d") as day,
              HOUR(in_date) as hour
       FROM solution
       WHERE result = 4
         AND contest_id = ?
       GROUP BY DATE_FORMAT(in_date, "%d"),HOUR(in_date)
       UNION ALL
       SELECT count(1) as cnt,
              YEAR(in_date) as year,
              MONTH(in_date) as month,
              DATE_FORMAT(in_date, "%d") as day,
              HOUR(in_date) as hour
       FROM vjudge_solution
       WHERE result = 4
         AND contest_id = ?
       GROUP BY DATE_FORMAT(in_date, "%d"),HOUR(in_date)) accept
      ON sub.day = accept.day AND sub.hour = accept.hour AND
         sub.year = accept.year AND sub.month = accept.month`,
`SELECT sub.hour,sub.minute,sub.cnt as submit,accept.cnt as accepted
 FROM (SELECT count(1) as cnt,HOUR(in_date) as hour,
              MINUTE(in_date) as minute
       FROM solution
       WHERE contest_id = ?
       GROUP BY HOUR(in_date),MINUTE(in_date)
       UNION ALL
       SELECT count(1) as cnt,HOUR(in_date) as hour,
              MINUTE(in_date) as minute
       FROM vjudge_solution
       WHERE contest_id = ?
       GROUP BY HOUR(in_date),MINUTE(in_date)) sub
        LEFT JOIN
      (SELECT count(1) as cnt,HOUR(in_date) as hour,
              MINUTE(in_date) as minute
       FROM solution
       WHERE result = 4
         AND contest_id = ?
       GROUP BY HOUR(in_date),MINUTE(in_date)
       UNION ALL
       SELECT count(1) as cnt,HOUR(in_date) as hour,
              MINUTE(in_date) as minute
       FROM vjudge_solution
       WHERE result = 4
         AND contest_id = ?
       GROUP BY HOUR(in_date),MINUTE(in_date)) accept
      ON sub.hour = accept.hour AND sub.minute = accept.minute`,
`SELECT sub.minute,sub.second,sub.cnt as submit,accept.cnt as accepted
 FROM (SELECT count(1) as cnt,MINUTE(in_date) as minute,
              SECOND(in_date) as second
       FROM solution
       WHERE contest_id = ?
       GROUP BY MINUTE(in_date),SECOND(in_date)
       UNION ALL
       SELECT count(1) as cnt,MINUTE(in_date) as minute,
              SECOND(in_date) as second
       FROM vjudge_solution
       WHERE contest_id = ?
       GROUP BY MINUTE(in_date),SECOND(in_date)) sub
        LEFT JOIN
      (SELECT count(1) as cnt,MINUTE(in_date) as minute,
              SECOND(in_date) as second
       FROM solution
       WHERE result = 4
         AND contest_id = ?
       GROUP BY MINUTE(in_date),SECOND(in_date)
       UNION ALL
       SELECT count(1) as cnt,MINUTE(in_date) as minute,
              SECOND(in_date) as second
       FROM vjudge_solution
       WHERE result = 4
         AND contest_id = ?
       GROUP BY MINUTE(in_date),SECOND(in_date)) accept
      ON sub.minute = accept.minute AND sub.second = accept.second`,
`SELECT sub.year,sub.month,sub.cnt as submit,accept.cnt as accepted
                                              FROM (SELECT count(1)       as cnt,YEAR(in_date) as year,
      MONTH(in_date) as month
   FROM solution
   GROUP BY YEAR(in_date),MONTH(in_date)) sub
LEFT JOIN
  (SELECT count(1) as cnt,YEAR(in_date) as year,MONTH(in_date) as month
   FROM solution
   WHERE result = 4
   GROUP BY YEAR(in_date),MONTH(in_date)) accept
  ON sub.year = accept.year AND sub.month = accept.month`
];

const check_owner = (data, owner) => {
	if (owner) {
		return data;
	} else {
		return "----";
	}
};

const infoHandler = async (sid, table_name, sendmsg) => {
	const data = await cache_query(`select error from ${table_name} where solution_id=?`, [sid]);
	if (data.length > 0) {
		sendmsg.data["tr"] = escape(data[0].error);
		query(`delete error from ${table_name} where solution_id=?`, [sid]);
	}
};

function renameProperty(element, newProperty, oldProperty) {
	element[newProperty] = element[oldProperty];
	delete element[oldProperty];
}

function validateProblemId(req) {
	if (isNaN(req.params.problem_id)) {
		if (req.params.problem_id === "null" || !req.params.problem_id) {
			return undefined;
		} else {
			return req.params.problem_id.toUpperCase().charCodeAt(0) - "A".charCodeAt(0);
		}
	} else {
		return parseInt(req.params.problem_id);
	}
}

function invalidProblemIdHandler(httpInstance, problem_id, result) {
	const {req, res} = httpInstance;
	if (isNaN(problem_id) && problem_id !== undefined) {
		res.json({
			result: result,
			const_list: const_name,
			self: req.session.user_id,
			isadmin: req.session.isadmin,
			browse_code: req.session.source_browser,
			end: false
		});
		return true;
	}
}

function generateSqlData(request_query) {
	let where_sql = [], sql_arr = [];
	for (let i in request_query) {
		if (typeof request_query[i] === "undefined" || typeof request_query[i] === "boolean") {
			continue;
		}
		if (typeof request_query[i] === "string" || typeof request_query[i] === "number") {
			where_sql.push( ` ${i} = ?`);
			sql_arr.push(request_query[i]);
		} else if (typeof request_query[i] === "object") {
			const ele = request_query[i];
			if (ele.length) {
				for (let val of ele) {
					if (typeof val === "undefined" || val === null) {
						continue;
					}
					if (typeof val === "string" || typeof val === "number") {
						where_sql.push(` ${i} = ?`);
						sql_arr.push(val);
					} else if (isCompareFlag(val.type)) {
						where_sql.push(` ${i} ${compareSymbol[val.type]} ?`);
						sql_arr.push(val.value);
					}
				}
			} else {
				if (isCompareFlag(ele.type)) {
					where_sql.push(` ${i} ${compareSymbol[ele.type]} ?`);
					sql_arr.push(ele.value);
				}
			}
		}
	}
	return [where_sql, sql_arr];
}

async function buildResponse(req, val, request_query, browser_privilege, _end) {
	const _user_info = await cache_query("SELECT nick,avatar,avatarUrl,email FROM users WHERE user_id = ?", [val.user_id]);
	if (_user_info.length > 0) {
		const nick = _user_info[0].nick.trim();
		const avatar = Boolean(_user_info[0].avatar);
		const avatarUrl = _user_info[0].avatarUrl || "";
		const email = _user_info[0].email || "";
		let element = Object.assign({nick, avatar, avatarUrl, email}, val);
		renameProperty(element, "sim_id", "sim_s_id");
		renameProperty(element, "length", "code_length");
		if ((request_query.contest_id && browser_privilege) || !request_query.contest_id || _end) {
			return element;
		} else {
			const owner = req.session.user_id === val.user_id;
			return Object.assign(element, {
				memory: check_owner(val.memory, owner),
				time: check_owner(val.time, owner),
				length: check_owner(val.code_length, owner)
			});
		}
	}
}

async function get_status(req, res, next, request_query = {}, limit = 0) {
	let _res;
	let [where_sql, sql_arr] = generateSqlData(request_query);
	let pre_sim = "", end_sim = "";
	if (request_query.sim) {
		if (request_query.user_id) {
			let user_id_sql = "";
			if (request_query.user_id) {
				user_id_sql = " where s_user_id = ?";
				sql_arr.push(request_query.user_id);
			}
			where_sql.push( ` solution_id in (select s_id as solution_id from sim${user_id_sql})`);
		} else {
			pre_sim = "select * from(";
			end_sim = ")t where sim is not null";
		}
	}
	let _end = false;
	const browser_privilege = req.session.isadmin || req.session.source_browser || (request_query.contest_id && await ContestAssistantManager.userIsContestAssistant(request_query.contest_id, req.session.user_id));
	if (browser_privilege) {
		where_sql = where_sql.join(" and ").trim();
		if (where_sql.length > 0) {
			where_sql = ` where ${where_sql}`;
		}
		if (request_query.contest_id) {
			sql_arr.push(limit);
			_res = await cache_query(`${pre_sim}select * from
								(select fingerprint,fingerprintRaw,solution_id,pass_rate,ip,contest_id,num,problem_id,user_id,time,memory,in_date,result,language,code_length,judger, "local" as oj_name 
								from solution ${where_sql}) sol
								left join sim on sim.s_id = sol.solution_id
								order by sol.in_date desc,sol.solution_id desc${end_sim} limit ?,20`, sql_arr);
		} else {
			sql_arr.push(limit);
			_res = await cache_query(`${pre_sim}select * from
								(select fingerprint,fingerprintRaw,solution_id,pass_rate,share,ip,contest_id,num,problem_id,user_id,time,memory,in_date,result,language,code_length,judger, "local" as oj_name 
								from solution ${where_sql}) sol
								left join sim on sim.s_id = sol.solution_id
								order by sol.solution_id desc${end_sim} limit ?,20`, sql_arr);
		}
	} else if (request_query.contest_id) {
		where_sql.unshift("problem_id > 0");
		where_sql = where_sql.join(" and ").trim();
		where_sql = ` where ${where_sql}`;

		sql_arr.push(limit);
		_end = await cache_query("select count(1),end_time as cnt from contest where end_time<NOW() and contest_id = ?", [request_query.contest_id]);
		_end = _end[0].cnt;
		_res = await cache_query(`${pre_sim}select * from
								(select fingerprint,fingerprintRaw,solution_id,contest_id,ip,num,problem_id,user_id,time,memory,in_date,result,language,code_length,judger, "local" as oj_name 
								from solution ${where_sql}) sol
								left join sim on sim.s_id = sol.solution_id
								order by sol.in_date desc, sol.solution_id desc${end_sim} limit ?,20`, sql_arr);
	} else {
		where_sql.unshift("problem_id > 0");
		where_sql.unshift("contest_id is null");
		where_sql = where_sql.join(" and ").trim();
		where_sql = ` where ${where_sql}`;
		sql_arr.push(limit);
		_res = await cache_query(`${pre_sim}select * from
								(select fingerprint,fingerprintRaw,solution_id,
								if((share = 1 and not exists (select * from contest where contest_id in
           (select contest_id from contest_problem where solution.problem_id = contest_problem.problem_id)
          and end_time > NOW()) ),1,0) as share
								,pass_rate,problem_id,ip,contest_id,num,user_id,time,
								memory,in_date,result,language,code_length,judger, "local" as oj_name from solution
								${where_sql}) sol
								left join sim on sim.s_id = sol.solution_id
								order by sol.in_date desc,sol.solution_id desc${end_sim} limit ?,20`, sql_arr);
	}
	let result = await Promise.all(_res.map(e => buildResponse(req, e, request_query, browser_privilege, _end)));
	res.json({
		result: result,
		const_list: const_name,
		self: req.session.user_id,
		isadmin: req.session.isadmin,
		browse_code: browser_privilege,
		end: Boolean(_end)
	});
}

function calculateDiffTimeMilliseconds(diff_time) {
	return diff_time.years * YEARS
		+ diff_time.months * MONTH
		+ diff_time.weeks * WEEKS
		+ diff_time.days * DAYS
		+ diff_time.minutes * MINUTES
		+ diff_time.seconds * SECONDS
		+ diff_time.milliseconds;
}

const graphLabel = [["year", "month"], ["month", "day"], ["day", "hour"], ["hour", "minute"], ["minute", "second"]];

async function graphDataHandler(res, request_query, idx) {
	res.json({
		result: await cache_query(graphDataSql[idx],
			[request_query.contest_id, request_query.contest_id, request_query.contest_id, request_query.contest_id]),
		label: graphLabel[idx]
	});
}

async function getGraphData(req, res, request_query = {}) {
	try {
		if (request_query.contest_id) {
			const result = await cache_query("SELECT * FROM contest WHERE contest_id = ?", [request_query.contest_id]);
			if (result.length) {
				const start_time = new Date(result[0].start_time), end_time = new Date(result[0].end_time);
				const diffMilliseconds = calculateDiffTimeMilliseconds(timediff(start_time, new Date(Math.min(new Date(), end_time))));
				if (diffMilliseconds > 10 * MONTH) {
					graphDataHandler(res, request_query, 0);
				} else if (diffMilliseconds > 12 * DAYS) {
					graphDataHandler(res, request_query, 1);
				} else if (diffMilliseconds > 12 * HOURS) {
					graphDataHandler(res, request_query, 2);
				} else if (diffMilliseconds > 12 * MINUTES) {
					graphDataHandler(res, request_query, 3);
				} else {
					graphDataHandler(res, request_query, 4);
				}
			}
		} else {
			const result = await cache_query(graphDataSql[5]);
			res.json({
				result: result,
				label: graphLabel[0]
			});
		}
	} catch (e) {
		logger.fatal(e);
	}
}

router.get("/", async function (req, res, next) {
	await get_status(req, res, next);
});

function validateUserId(req) {
	if(req.params.user_id === "null") {
		return undefined;
	}
	else if(req.params.user_id === "my"){
		return req.session.user_id;
	}
	else {
		return req.params.user_id;
	}
}


router.get("/:problem_id/:user_id/:language/:result/:limit", async function (req, res, next) {
	const problem_id = req.params.problem_id === "null" ? undefined : parseInt(req.params.problem_id);
	const user_id = validateUserId(req);
	const language = req.params.language === "null" ? undefined : parseInt(req.params.language);
	const result = req.params.result === "null" ? undefined : parseInt(req.params.result);
	const limit = req.params.limit === "null" ? 0 : parseInt(req.params.limit);
	if (invalidProblemIdHandler({req, res}, problem_id, result)) {
		return;
	}
	await get_status(req, res, next, {
		problem_id: problem_id,
		user_id: user_id,
		language: language,
		result: result
	}, limit);

});

router.get("/:problem_id/:user_id/:language/:result/:limit/:contest_id", async function (req, res, next) {
	let problem_id;
	const contest_id = req.params.contest_id === "null" ? undefined : parseInt(req.params.contest_id);
	if (typeof contest_id === "number" && contest_id < 1000 && contest_id >= 0) {
		return next();
	}
	problem_id = validateProblemId(req);
	const user_id = req.params.user_id === "null" ? undefined : req.params.user_id;
	const language = req.params.language === "null" ? undefined : parseInt(req.params.language);
	const result = req.params.result === "null" ? undefined : parseInt(req.params.result);
	const limit = req.params.limit === "null" ? 0 : parseInt(req.params.limit);
	await get_status(req, res, next, {
		num: problem_id,
		user_id: user_id,
		language: language,
		result: result,
		contest_id: contest_id
	}, limit);
});

router.get("/:problem_id/:user_id/:language/:result/:limit/:sim", async function (req, res, next) {
	const problem_id = req.params.problem_id === "null" ? undefined : parseInt(req.params.problem_id);
	const user_id = req.params.user_id === "null" ? undefined : req.params.user_id;
	const language = req.params.language === "null" ? undefined : parseInt(req.params.language);
	const result = req.params.result === "null" ? undefined : parseInt(req.params.result);
	const limit = req.params.limit === "null" ? 0 : parseInt(req.params.limit);
	const sim = req.params.sim === "null" ? undefined : parseInt(req.params.sim);
	if (invalidProblemIdHandler({req, res}, problem_id, result)) {
		return;
	}
	await get_status(req, res, next, {
		problem_id: problem_id,
		user_id: user_id,
		language: language,
		result: result,
		sim: !!sim
	}, limit);

});

router.get("/:problem_id/:user_id/:language/:result/:limit/:contest_id/:sim", async function (req, res, next) {
	let problem_id;
	const contest_id = req.params.contest_id === "null" ? undefined : parseInt(req.params.contest_id);
	const sim = req.params.sim === "null" ? undefined : parseInt(req.params.sim);
	if (typeof contest_id === "number" && contest_id < 1000 && contest_id >= 0) {
		return next();
	}
	problem_id = validateProblemId(req);
	const user_id = req.params.user_id === "null" ? undefined : req.params.user_id;
	const language = req.params.language === "null" ? undefined : parseInt(req.params.language);
	const result = req.params.result === "null" ? undefined : parseInt(req.params.result);
	const limit = req.params.limit === "null" ? 0 : parseInt(req.params.limit);
	await get_status(req, res, next, {
		num: problem_id,
		user_id: user_id,
		language: language,
		result: result,
		contest_id: contest_id,
		sim: !!sim
	}, limit);
});

router.get("/:problem_id/:user_id/:language/:result/:limit/:sim/:privilege", async function (req, res, next) {
	const problem_id = req.params.problem_id === "null" ? undefined : parseInt(req.params.problem_id);
	const user_id = req.params.user_id === "null" ? undefined : req.params.user_id;
	const language = req.params.language === "null" ? undefined : parseInt(req.params.language);
	const result = req.params.result === "null" ? undefined : parseInt(req.params.result);
	const limit = req.params.limit === "null" ? 0 : parseInt(req.params.limit);
	const sim = req.params.sim === "null" ? undefined : parseInt(req.params.sim);
	const privilege = req.params.privilege === "null" ? undefined : parseInt(req.params.privilege);
	if (invalidProblemIdHandler({req, res}, problem_id, result)) {
		return;
	}
	await get_status(req, res, next, {
		problem_id: [problem_id, privilege ? {type: GREATER, value: 0} : undefined],
		user_id: user_id,
		language: language,
		result: result,
		sim: !!sim
	}, limit);

});


router.get("/:problem_id/:user_id/:language/:result/:limit/:contest_id/:sim/:privilege", async function (req, res, next) {
	let problem_id;
	const contest_id = req.params.contest_id === "null" ? undefined : parseInt(req.params.contest_id);
	const sim = req.params.sim === "null" ? undefined : parseInt(req.params.sim);
	const privilege = req.params.privilege === "null" ? undefined : parseInt(req.params.privilege);
	if (typeof contest_id === "number" && contest_id < 1000 && contest_id >= 0) {
		return next();
	}
	problem_id = validateProblemId(req);
	const user_id = req.params.user_id === "null" ? undefined : req.params.user_id;
	const language = req.params.language === "null" ? undefined : parseInt(req.params.language);
	const result = req.params.result === "null" ? undefined : parseInt(req.params.result);
	const limit = req.params.limit === "null" ? 0 : parseInt(req.params.limit);
	await get_status(req, res, next, {
		num: [problem_id],
		problem_id: [privilege ? {type: GREATER, value: 0} : undefined],
		user_id: user_id,
		language: language,
		result: result,
		contest_id: contest_id,
		sim: !!sim
	}, limit);
});

router.get("/graph", async function (req, res) {
	const cid = req.query.cid ? parseInt(req.query.cid) : null;
	const date_flag = req.query.date;
	await getGraphData(req, res, {
		contest_id: cid,
		date_flag: date_flag
	});
});

router.get("/solution", async function (req, res) {
	const sid = req.query.sid ? parseInt(req.query.sid) : null;
	const browse_privilege = sid !== null && await SourcePrivilegeCache.checkPrivilege(req.session, sid);
	if (sid) {
		const _result = await query(`SELECT user_id,
                                            language,
                                            if((share = 1 or solution_id in (select solution_id from
                                             tutorial where solution.solution_id = ?)) and not exists
                                             (select * from contest where contest_id in (select contest_id
                                             from contest_problem where solution.problem_id = contest_problem.problem_id)
                                             and end_time > NOW()), 1, 0) as share,time,memory,code_length from solution
                                     WHERE solution_id = ?`, [sid, sid]);
		if (_result.length > 0 && (_result[0].user_id === req.session.user_id || browse_privilege || _result[0].share === 1)) {
			res.json({
				status: "OK",
				data: {
					solution_id: sid,
					user_id: _result[0].user_id,
					language: _result[0].language,
					time: _result[0].time,
					memory: _result[0].memory
				}
			});
		} else {
			res.json(error.errorMaker("error sid / not privilege"));
		}
	} else {
		res.json(error.invalidParams);
	}
});

router.get("/:sid/:tr", function (req, res, next) {
	const sid = parseInt(req.params.sid);
	if (isNaN(sid)) {
		next();
	} else {
		next("route");
	}
}, function (req, res) {
	const errmsg = {
		status: "error",
		statement: "invalid parameter"
	};
	res.header("Content-Type", "application/json");
	res.json(errmsg);
});

router.get("/:sid/:tr", async function (req, res) {
	const sid = parseInt(req.params.sid);
	const test_run = req.params.tr;
	await cache_query("select * from solution where solution_id=?", [sid]).then(async (val) => {
		const dataPack = val[0];
		const sendmsg = {
			status: "OK",
			data: {
				result: dataPack["result"],
				memory: dataPack["memory"],
				time: dataPack["time"],
				pass_point: dataPack["pass_point"]
			}
		};
		if (test_run.length > 0 && parseInt(dataPack["result"]) > 3) {
			const result_flag = parseInt(dataPack["result"]);
			await infoHandler(sid, result_flag === 11 ? "compileinfo" : "runtimeinfo", sendmsg);
		}
		res.json(sendmsg);
	}).catch((val) => {
		res.json(error.errorMaker(val));
	});
});


module.exports = ["/status", auth, router];
