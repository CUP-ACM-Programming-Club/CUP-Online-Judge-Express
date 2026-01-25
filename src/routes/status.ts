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
import auth from "../middleware/auth";
const [error] = require("../module/const_var");
const admin_auth = require("../middleware/admin");
import client from "../module/redis";
import { getGraphDataWithCache, indexToGranularity, TIME_GRANULARITY } from "./status/graph_data_optimizer";

const SECONDS = 1000;
const MINUTES = 60 * SECONDS;
const HOURS = 60 * MINUTES;
const DAYS = 24 * HOURS;
const WEEKS = 7 * DAYS;
const MONTH = 30 * DAYS;
const YEARS = 365 * DAYS;

const GREATER = "greater";

// Fallback SQLs (reconstructed)
const graphDataSql = [
	"SELECT count(1) as cnt, year(in_date) as year, month(in_date) as month FROM solution WHERE contest_id = ? GROUP BY year(in_date), month(in_date)",
	"SELECT count(1) as cnt, month(in_date) as month, day(in_date) as day FROM solution WHERE contest_id = ? GROUP BY month(in_date), day(in_date)",
	"SELECT count(1) as cnt, day(in_date) as day, hour(in_date) as hour FROM solution WHERE contest_id = ? GROUP BY day(in_date), hour(in_date)",
	"SELECT count(1) as cnt, hour(in_date) as hour, minute(in_date) as minute FROM solution WHERE contest_id = ? GROUP BY hour(in_date), minute(in_date)",
	"SELECT count(1) as cnt, minute(in_date) as minute, second(in_date) as second FROM solution WHERE contest_id = ? GROUP BY minute(in_date), second(in_date)",
	"SELECT count(1) as cnt, year(in_date) as year, month(in_date) as month FROM solution GROUP BY year(in_date), month(in_date)"
];

function validateProblemId(req: any) {
	let pid = req.params.problem_id;
	if (pid === "null" || pid === undefined) {
		return undefined;
	}
	const val = parseInt(pid);
	if (isNaN(val)) {
		return undefined;
	}
	return val;
}

function invalidProblemIdHandler(ctx: any, problem_id: any, result: any) {
	if (problem_id && isNaN(problem_id)) {
		ctx.res.json(error.invalidParams);
		return true;
	}
	return false;
}

async function infoHandler(sid: number, table: string, sendmsg: any) {
	const data = await cache_query(`select error from ${table} where solution_id = ?`, [sid]);
	if (data.length > 0) {
		sendmsg.data.tr = data[0].error;
	}
}

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

import StatusService from "../service/StatusService";
import { JudgeResult } from "../enums/JudgeResult";

async function get_status(req: any, res: any, next: any, request_query: any = {}, limit: any = 0) {
	try {
		request_query.limit = limit;
		const data = await StatusService.getStatusList(req, request_query);
		res.json(data);
	} catch (e) {
		logger.error("get_status error", e);
		next(e);
	}
}

function calculateDiffTimeMilliseconds(diff_time: any) {
	return diff_time.years * YEARS
		+ diff_time.months * MONTH
		+ diff_time.weeks * WEEKS
		+ diff_time.days * DAYS
		+ diff_time.minutes * MINUTES
		+ diff_time.seconds * SECONDS
		+ diff_time.milliseconds;
}

const graphLabel = [["year", "month"], ["month", "day"], ["day", "hour"], ["hour", "minute"], ["minute", "second"]];

async function graphDataHandler(res: any, request_query: any, idx: any) {
	try {
		// 使用优化后的查询 (SQL 优化 + Redis 缓存)
		const granularity = indexToGranularity(idx);
		const result = await getGraphDataWithCache(request_query.contest_id, granularity);

		res.json({
			result: result,
			label: graphLabel[idx]
		});
	} catch (e) {
		// 降级到原始 SQL (如果优化失败)
		logger.warn(`Optimized query failed for idx ${idx}, falling back to original SQL`, e);
		res.json({
			result: await cache_query(graphDataSql[idx],
				[request_query.contest_id, request_query.contest_id, request_query.contest_id, request_query.contest_id]),
			label: graphLabel[idx]
		});
	}
}

async function getGraphData(req: any, res: any, request_query: any = {}) {
	try {
		if (request_query.contest_id) {
			const result = await cache_query("SELECT * FROM contest WHERE contest_id = ?", [request_query.contest_id]);
			if (result.length) {
				const start_time = new Date(result[0].start_time), end_time = new Date(result[0].end_time);
				const diffMilliseconds = calculateDiffTimeMilliseconds(timediff(start_time, new Date(Math.min(new Date().getTime(), end_time.getTime()))));
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
			// 全局统计（无 contest_id）
			try {
				const result = await getGraphDataWithCache(0, TIME_GRANULARITY.MONTH);
				res.json({
					result: result,
					label: graphLabel[0]
				});
			} catch (e) {
				// 降级到原始 SQL
				logger.warn('Optimized global graph query failed, falling back to original SQL', e);
				const result = await cache_query(graphDataSql[5]);
				res.json({
					result: result,
					label: graphLabel[0]
				});
			}
		}
	} catch (e) {
		logger.fatal(e);
	}
}

router.get("/", async function (req: any, res: any, next: any) {
	await get_status(req, res, next);
});

function validateUserId(req: any) {
	if (req.params.user_id === "null") {
		return undefined;
	}
	else if (req.params.user_id === "my") {
		return req.session.user_id;
	}
	else {
		return req.params.user_id;
	}
}


router.get("/:problem_id/:user_id/:language/:result/:limit", async function (req: any, res: any, next: any) {
	const problem_id = req.params.problem_id === "null" ? undefined : parseInt(req.params.problem_id);
	const user_id = validateUserId(req);
	const language = req.params.language === "null" ? undefined : parseInt(req.params.language);
	const result = req.params.result === "null" ? undefined : parseInt(req.params.result);
	const limit = req.params.limit === "null" ? 0 : parseInt(req.params.limit);
	if (invalidProblemIdHandler({ req, res }, problem_id, result)) {
		return;
	}
	await get_status(req, res, next, {
		problem_id: problem_id,
		user_id: user_id,
		language: language,
		result: result
	}, limit);

});

router.get("/:problem_id/:user_id/:language/:result/:limit/:contest_id", async function (req: any, res: any, next: any) {
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

router.get("/:problem_id/:user_id/:language/:result/:limit/:sim", async function (req: any, res: any, next: any) {
	const problem_id = req.params.problem_id === "null" ? undefined : parseInt(req.params.problem_id);
	const user_id = req.params.user_id === "null" ? undefined : req.params.user_id;
	const language = req.params.language === "null" ? undefined : parseInt(req.params.language);
	const result = req.params.result === "null" ? undefined : parseInt(req.params.result);
	const limit = req.params.limit === "null" ? 0 : parseInt(req.params.limit);
	const sim = req.params.sim === "null" ? undefined : parseInt(req.params.sim);
	if (invalidProblemIdHandler({ req, res }, problem_id, result)) {
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

router.get("/:problem_id/:user_id/:language/:result/:limit/:contest_id/:sim", async function (req: any, res: any, next: any) {
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

router.get("/:problem_id/:user_id/:language/:result/:limit/:sim/:privilege", async function (req: any, res: any, next: any) {
	const problem_id = req.params.problem_id === "null" ? undefined : parseInt(req.params.problem_id);
	const user_id = req.params.user_id === "null" ? undefined : req.params.user_id;
	const language = req.params.language === "null" ? undefined : parseInt(req.params.language);
	const result = req.params.result === "null" ? undefined : parseInt(req.params.result);
	const limit = req.params.limit === "null" ? 0 : parseInt(req.params.limit);
	const sim = req.params.sim === "null" ? undefined : parseInt(req.params.sim);
	const privilege = req.params.privilege === "null" ? undefined : parseInt(req.params.privilege);
	if (invalidProblemIdHandler({ req, res }, problem_id, result)) {
		return;
	}
	await get_status(req, res, next, {
		problem_id: [problem_id, privilege ? { type: GREATER, value: 0 } : undefined],
		user_id: user_id,
		language: language,
		result: result,
		sim: !!sim
	}, limit);

});


router.get("/:problem_id/:user_id/:language/:result/:limit/:contest_id/:sim/:privilege", async function (req: any, res: any, next: any) {
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
		problem_id: [privilege ? { type: GREATER, value: 0 } : undefined],
		user_id: user_id,
		language: language,
		result: result,
		contest_id: contest_id,
		sim: !!sim
	}, limit);
});

router.get("/graph", async function (req: any, res: any) {
	const cid = req.query.cid ? parseInt(req.query.cid) : null;
	const date_flag = req.query.date;
	await getGraphData(req, res, {
		contest_id: cid,
		date_flag: date_flag
	});
});

router.get("/solution", async function (req: any, res: any) {
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

router.get("/:sid/:tr", function (req: any, res: any, next: any) {
	const sid = parseInt(req.params.sid);
	if (isNaN(sid)) {
		next();
	} else {
		next("route");
	}
}, function (req: any, res: any) {
	const errmsg = {
		status: "error",
		statement: "invalid parameter"
	};
	res.header("Content-Type", "application/json");
	res.json(errmsg);
});

router.get("/:sid/:tr", async function (req: any, res: any) {
	const sid = parseInt(req.params.sid);
	const test_run = req.params.tr;
	await cache_query("select * from solution where solution_id=?", [sid]).then(async (val: any) => {
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
	}).catch((val: any) => {
		res.json(error.errorMaker(val));
	});
});



const routes: any = ["/status", auth, router];

// 导出缓存清除函数供其他模块使用（例如提交后清除相关比赛缓存）
import { clearGraphDataCache as _clearGraphDataCache } from "./status/graph_data_optimizer";
routes.clearGraphCache = _clearGraphDataCache;

export = routes;
