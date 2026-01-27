/* eslint-disable no-unused-vars */
import ContestAssistantManager from "../manager/contest/ContestAssistantManager";
import SourcePrivilegeCache from "../manager/submission/SourcePrivilegeCache";

const ENVIRONMENT = process.env.NODE_ENV || "prod";
const TEST_MODE = ENVIRONMENT.toLowerCase().indexOf("test") !== -1;
const express = require("express");
const router = express.Router();
const escape = require("escape-html");
const log4js = require("../module/logger");
const logger = log4js.logger("cheese", "info");
const const_name = require("../module/const_name");
const timediff = require("timediff");
import auth from "../middleware/auth";
const [error] = require("../module/const_var");
const admin_auth = require("../middleware/admin");
import client from "../module/redis";
import SubmissionService from "../service/SubmissionService";

const GREATER = "greater"; // Keep constants if used elsewhere? 
// Actually SECONDS..YEARS were used in calculateDiffTimeMilliseconds which is removed.
// graphDataSql is removed.

const SECONDS = 1000;
const MINUTES = 60 * SECONDS;
const HOURS = 60 * MINUTES;
const DAYS = 24 * HOURS;
const WEEKS = 7 * DAYS;
const MONTH = 30 * DAYS;
const YEARS = 365 * DAYS;



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


router.get("/:problem_id/:user_id/:language/:result/:limit", async (req: any, res: any, next: any) => {
	const problem_id = req.params.problem_id === "null" ? undefined : parseInt(req.params.problem_id);
	const user_id = req.params.user_id === "null" ? undefined : req.params.user_id;
	const language = req.params.language === "null" ? undefined : parseInt(req.params.language);
	const result = req.params.result === "null" ? undefined : parseInt(req.params.result);
	const limit = req.params.limit === "null" ? 0 : parseInt(req.params.limit);
	await get_status(req, res, next, {
		problem_id,
		user_id,
		language,
		result
	}, limit);
});

router.get("/", async (req: any, res: any, next: any) => {
	await get_status(req, res, next, {}, 0);
});

router.get("/graph", async function (req: any, res: any) {
	const cid = req.query.cid ? parseInt(req.query.cid as string) : undefined;
	const date_flag = req.query.date;
	try {
		const data = await StatusService.getGraphData(cid);
		res.json(data);
	} catch (e) {
		logger.error(e);
		res.json(error.errorMaker("Graph data error"));
	}
});

router.get("/solution", async function (req: any, res: any) {
	const sid = req.query.sid ? parseInt(req.query.sid) : null;
	const browse_privilege = sid !== null && await SourcePrivilegeCache.checkPrivilege(req.session, sid);
	if (sid) {
		const _result = await SubmissionService.getSolutionInfo(sid);
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
	try {
		const val = await SubmissionService.getSolutionDetail(sid);
		if (val && val.length > 0) {
			const dataPack = val[0];
			const sendmsg: any = {
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
				if (result_flag === 11) {
					const compileInfo = await SubmissionService.getCompileInfo(sid);
					if (compileInfo.length > 0) {
						sendmsg.data.tr = compileInfo[0].error;
					}
				} else {
					const runtimeInfo = await SubmissionService.getRuntimeInfo(sid);
					if (runtimeInfo.length > 0) {
						sendmsg.data.tr = runtimeInfo[0].error;
					}
				}
			}
			res.json(sendmsg);
		} else {
			res.json(error.errorMaker("Solution not found"));
		}
	} catch (e: any) {
		res.json(error.errorMaker(e));
	}
});



const routes: any = ["/status", auth, router];

// 导出缓存清除函数供其他模块使用（例如提交后清除相关比赛缓存）
import { clearGraphDataCache as _clearGraphDataCache } from "./status/graph_data_optimizer";
routes.clearGraphCache = _clearGraphDataCache;

export = routes;
