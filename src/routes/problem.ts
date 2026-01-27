/* eslint-disable no-console */
// import ProblemManager from "../manager/problem/ProblemManager";
import HttpError from "../module/util/HttpError";
import ProblemService from "../service/ProblemService";
import ContestService from "../service/ContestService";
import ProblemManageService from "../service/ProblemManageService";

const express = require("express");
const website_dir = global.config.website.dir;
const bluebird = require("bluebird");
const base64Img = bluebird.promisifyAll(require("base64-img"));
const { mkdirAsync } = require("../module/file/mkdir");
const cache = require("../module/cachePool");
const router = express.Router();
const log = console.log;
const log4js = require("../module/logger");
const logger = log4js.logger("cheese", "info");

import auth from "../middleware/auth";
const { error, ok } = require("../module/constants/state");
const path = require("path");
const ProblemInfoManager = require("../module/problem/ProblemInfoManager");
const ProblemSetCachePool = require("../module/problemset/ProblemSetCachePool");
const cheerio = require("cheerio");
const ENVIRONMENT = process.env.NODE_ENV;

require("../module/router_loader")(router, path.resolve(__dirname, "./problem"));

const TopicService = require("../service/TopicService").default;

// Label Handler -> ProblemService
async function labelHandler(httpInstance: any) {
	let { req, res } = httpInstance;
	let vjudge = req.query.vjudge !== undefined ? "vjudge_" : "";
	try {
		const result = await ProblemService.getLabels(vjudge);
		res.json(result);
		ProblemService.maintainLabels(vjudge);
	} catch (e) {
		log(e);
		res.json(error.database);
	}
}

// Route handlers refactored to use Services

router.get("/module/search/:val", async function (req: any, res: any) {
	try {
		const val = req.params.val;
		const result = await ProblemService.searchProblems(val, req.session.isadmin, false);
		res.json(result);
	}
	catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

router.get("/module/search/dropdown/:val", async (req: any, res: any) => {
	try {
		const val = req.params.val;
		const data: any = await ProblemService.searchProblems(val, req.session.isadmin, true);
		const sendData = [];
		for (let i in data) {
			if (Object.prototype.hasOwnProperty.call(data, i)) {
				sendData.push({
					name: `Problem ${data[i].problem_id}: ${data[i].title}`,
					value: parseInt(data[i].problem_id)
				});
			}
		}
		sendData.sort((a: any, b: any) => {
			let intVal = parseInt(val);
			let strVal = val + "";
			if (a.value === intVal && b.value !== intVal) {
				return -1;
			}
			else if (b.value === intVal && a.value !== intVal) {
				return 1;
			}
			else if (strVal.includes(a.value + "") && !strVal.includes(b.value + "")) {
				return -1;
			}
			else if (strVal.includes(b.value + "") && !strVal.includes(a.value + "")) {
				return 1;
			}
			else {
				return 0;
			}
		});
		res.json({
			success: true,
			results: sendData
		});
	}
	catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

function queryValidate(val: any) {
	let returnVal: any = {};
	for (let i in val) {
		returnVal[i] = val[i] === undefined ? -1 : val[i];
	}
	return returnVal;
}

router.get("/:source/", async function (req: any, res: any) {
	const source = req.params.source === "local" ? "" : req.params.source.toUpperCase();
	let { cid, tid, pid, id, sid: solution_id } = queryValidate(req.query);
	let labels = req.query.label !== undefined;
	let raw = req.query.raw !== undefined;
	[cid, tid, pid, id, solution_id] = ProblemService.judgeValidNumber([cid, tid, pid, id, solution_id]);

	try {
		if (~cid && ~pid) {
			const data = await ContestService.getContestProblemDetails(req, cid, pid);
			if (data.redirect) {
				res.json(error.attributeMaker({ redirect: data.url }));
			} else {
				res.json(data);
			}
		} else if (~tid && ~pid) {
			const data = await TopicService.getTopicProblemDetails(req, tid, pid);
			res.json(data);
		} else if (~id) {
			// Normal Logic
			const browse_privilege = ProblemService.checkPrivilege(req);
			if (!browse_privilege) {
				if (global.contest_mode) {
					res.json(error.contestMode);
					return;
				} else if (!await ProblemService.checkProblemAvailable(id)) {
					res.json(error.errorMaker("problem not available!"));
					return;
				} else if (await ProblemService.checkProblemInContest(id)) {
					res.json(error.errorMaker("problem is in contest"));
					return;
				}

				if (await ProblemService.checkProblemContestStatus(id)) {
					res.json(error.problemInContest);
					return;
				}
			}

			const data = await ProblemService.getProblem(req, {
				id,
				source,
				solution_id,
				raw,
				after_contest: true,
				uploader: await ProblemService.checkUploader(id)
			} as any);
			res.json(data);
		} else if (labels) {
			labelHandler({ req, res });
		} else {
			res.json(error.invalidParams);
		}
	} catch (e: any) {
		if (e instanceof HttpError) {
			res.json(e.json());
		} else if (e === error.contestMode || e === error.noprivilege || e === error.invalidParams) {
			res.json(e);
		} else {
			console.log(e);
			res.json(error.internalError);
		}
	}
});

router.post("/add", async (req: any, res: any) => {
	res.json(await ProblemManageService.createProblem(req, undefined, req.body));
});

router.post("/:source/:id", async function (req: any, res: any) {
	const problem_id = parseInt(req.params.id);
	const from = req.params.source || "";
	if (req.session.isadmin || req.session.editor) {
		try {
			await ProblemManageService.updateProblem(req, problem_id, from, req.body.json);
			res.json(ok.ok);
		} catch (e) {
			logger.fatal(e);
			res.json(error.errorMaker("parse error"));
		}
	} else {
		res.json(error.errorMaker("illegal request"));
	}
});

router.get("/:source/:id/:sid", async function (req: any, res: any) {
	const source = req.params.source === "local" ? "" : req.params.source.toUpperCase();
	const id = parseInt(req.params.id);
	const sid = parseInt(req.params.sid);
	const _res = cache.get("source/id/" + source + id + "/" + sid);
	if (_res === undefined) {
		try {
			const data = await ProblemService.getSourceCode(req, id, sid, source, source.length > 0);
			res.json(data);
		} catch (e: any) {
			if (e instanceof HttpError || e.status === "error") {
				res.json(e);
			} else {
				console.log(e);
				res.json(error.internalError);
			}
		}
	} else {
		res.json(_res);
	}
});

export = ["/problem", auth, router];
