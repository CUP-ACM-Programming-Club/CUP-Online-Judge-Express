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
const query = require("../module/mysql_query");
const cache_query = require("../module/mysql_cache");
import auth from "../middleware/auth";
const { error, ok } = require("../module/constants/state");
const path = require("path");
const ProblemInfoManager = require("../module/problem/ProblemInfoManager");
const ProblemSetCachePool = require("../module/problemset/ProblemSetCachePool");
const cheerio = require("cheerio");
const ENVIRONMENT = process.env.NODE_ENV;

require("../module/router_loader")(router, path.resolve(__dirname, "./problem"));

const checkContestPrivilege = async (req: any, cid: any) => {
	if (req.session.source_browser) return true;
	try {
		await ContestService.checkContestAccess(req, cid);
		return true;
	} catch (e) {
		return false;
	}
};

const maintainLabels = (vjudge: any) => {
	cache_query(`select label from ${vjudge}problem`)
		.then((rows: any) => {
			let all_label = [];
			for (let i of rows) {
				if (typeof i.label === "string" && i.label.length > 0) {
					for (let j of i.label.split(" ")) {
						all_label.push(j);
					}
				}
			}
			const data = [...new Set(all_label)];
			Promise.all(data.map(i => query(`INSERT INTO ${vjudge}label_list (label_name)
SELECT * FROM (SELECT ?) AS tmp
WHERE NOT EXISTS (
    SELECT label_name FROM ${vjudge}label_list WHERE label_name = ?
) LIMIT 1;`, [i, i])));
			return true;
		}).catch((e: any) => log(e));
};

async function contestProblemHandler(httpInstance: any, val: any = {}) {
	let { req, res } = httpInstance;
	let { source, solution_id, raw, cid, pid } = val;
	const [contest, result] = await Promise.all([cache_query("SELECT * FROM contest WHERE contest_id = ?", [cid]), cache_query("SELECT * FROM contest_problem WHERE contest_id = ? and " +
		"num = ?", [cid, pid])]);
	if (!ProblemService.checkPrivilege(req)) {
		if (global.contest_mode && parseInt(contest[0].cmod_visible) === 0) {
			res.json(error.contestMode);
			return;
		}
	}
	if (parseInt(contest[0].private) === 1 && !await checkContestPrivilege(req, cid)) {
		res.json(error.noprivilege);
		return;
	}
	if (result.length > 0) {
		if (result[0].oj_name && result[0].oj_name.length > 0) {
			res.json(error.attributeMaker({ redirect: `${result[0].oj_name.toLowerCase()}submitpage.php?cid=${cid}&pid=${pid}` }));
			return;
		}
		let { langmask, end_time, limit_hostname } = contest[0];
		let problem_id = result[0].problem_id;

		try {
			const data = await ProblemService.getProblem(req, {
				id: problem_id,
				cid,
				pid,
				source,
				solution_id,
				raw,
				langmask,
				after_contest: require("dayjs")().isAfter(require("dayjs")(end_time)),
				limit_hostname
			} as any);
			res.json(data);
		} catch (e) {
			console.log(e);
			res.json(error.internalError);
		}
	} else {
		res.json(error.invalidParams);
	}
}

async function TopicProblemHandler(httpInstance: any, val: any = {}) {
	let { req, res } = httpInstance;
	let { tid, pid, source, solution_id, raw } = val;
	if (!ProblemService.checkPrivilege(req) && global.contest_mode) {
		res.json(error.contestMode);
		return;
	}
	const result = await cache_query("SELECT * FROM special_subject_problem WHERE topic_id = ? and " +
		"num = ?", [tid, pid]);
	if (result.length > 0) {
		let problem_id = result[0].problem_id;
		try {
			const data = await ProblemService.getProblem(req, {
				id: problem_id,
				source,
				solution_id,
				raw,
				after_contest: true
			} as any);
			res.json(data);
		} catch (e) {
			console.log(e);
			res.json(error.internalError);
		}
	} else {
		res.json(error.invalidParams);
	}
}

async function normalProblemHandler(httpInstance: any, val: any = {}) {
	let { req, res } = httpInstance;
	let { id, source, solution_id, raw } = val;
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
	}

	// Check contest end time for non-privileged users
	if (!browse_privilege) {
		const _end_time = await cache_query(`select UNIX_TIMESTAMP(end_time) as t from contest where contest_id in (select contest_id from contest_problem
         where problem_id = ?)`, [id]);
		if (_end_time.length > 0 && require("dayjs")().isBefore(require("dayjs")(_end_time[0].t * 1000))) {
			res.json(error.problemInContest);
			return;
		}
	}

	try {
		const data = await ProblemService.getProblem(req, {
			id,
			source,
			solution_id,
			raw,
			after_contest: true,
			uploader: await ProblemService.checkUploader(id)
		} as any);
		res.json(data);
	} catch (e) {
		console.log(e);
		res.json(error.internalError);
	}
}

async function labelHandler(httpInstance: any) {
	let { req, res } = httpInstance;
	let vjudge = req.query.vjudge !== undefined ? "vjudge_" : "";
	cache_query(`select label_name from ${vjudge}label_list`)
		.then((rows: any) =>
			res.json({
				status: "OK",
				data: rows.map((val: any) => val.label_name)
			})
		).catch((e: any) => log(e));
	maintainLabels(vjudge);
}

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
		sendData.sort((a, b) => {
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

// Cache Logic moved to Service, wrapper kept for compatibility if needed or removed
// router.get("/:source/:id") logic is below in root handler

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
	if (~cid && ~pid) {
		contestProblemHandler({ req, res }, { source, solution_id, raw, cid, pid });
	} else if (~tid && ~pid) {
		TopicProblemHandler({ req, res }, { tid, pid, source, solution_id, raw });
	} else if (~id) {
		normalProblemHandler({ req, res }, { id, source, solution_id, raw });
	} else if (labels) {
		labelHandler({ req, res });
	} else {
		res.json(error.invalidParams);
	}
});

async function storePhotoToDir(problem_id: any, key: any, data: any, type: any) {
	const picPath = path.join(website_dir, "images", problem_id.toString(), type);
	await mkdirAsync(picPath);
	try {
		await base64Img.imgAsync(data, picPath, key);
	} catch (e) {
		console.log(e);
	}
}

function storePhotoBase(problem_id: any, name: any, iterableData: any) {
	for (let i in iterableData) {
		storePhotoToDir(problem_id, i, iterableData[i], name);
	}
}

function storePhoto(problem_id: any, photo: any = { description: {}, input: {}, output: {} }) {
	for (let i in photo) {
		storePhotoBase(problem_id, i, photo[i]);
	}
}

router.post("/add", async (req: any, res: any) => {
	res.json(await ProblemManageService.createProblem(req, undefined, req.body));
});

router.post("/:source/:id", function (req: any, res: any) {
	const problem_id = parseInt(req.params.id);
	const from = req.params.source || "";
	let local = false;
	if (from.length <= 2 || from === "local") {
		local = true;
	}
	if (req.session.isadmin || req.session.editor) {
		let json;
		try {
			json = Object.assign({
				title: "",
				time: 0,
				memory: 0,
				description: "",
				input: "",
				output: "",
				sampleinput: "",
				sampleoutput: "",
				label: "",
				hint: "",
				spj: 0
			}, req.body.json);
			console.log(req.body.json);
			storePhoto(problem_id, json.imageData);
			let sql = `update ${local ? "" : "vjudge_"}problem set title = ?,time_limit = ?,
			memory_limit = ?,description = ?,input = ?,output = ?,
			sample_input = ?,sample_output = ?,label = ?${local ? " ,hint = ?, spj = ? " : ""} where problem_id = ?
			 ${local ? "" : " and source = ?"}`;
			let sqlArr = [json.title, ProblemService.checkEmpty(json.time), ProblemService.checkEmpty(json.memory), json.description, json.input,
			json.output, json.sampleinput, json.sampleoutput, json.label];
			if (local) {
				sqlArr.push(json.hint, json.spj,
					problem_id);
			} else {
				sqlArr.push(problem_id, from);
			}
			query(sql, sqlArr)
				.then()
				.catch((err: any) => {
					if (ENVIRONMENT === "test") {
						console.error(`${path.basename(__filename)} line 542:`);
						console.error(err);
					} else {
						logger.fatal(err);
					}
				});
			ProblemInfoManager.newInstance().setProblemId(problem_id).removeCache();
			ProblemSetCachePool.removeAll();
			res.json(ok.ok);
		} catch (e) {
			logger.fatal(e);
			res.json(error.errorMaker("parse error"));
		}
	} else {
		res.json(error.errorMaker("illegal request"));
	}
});

async function getSourceCode(req: any, res: any, obj: any, opt: any = {}) {
	opt = Object.assign({ prefix: "", id: 0, sid: 0, source: "LOCAL" }, opt);
	let { id, sid, source, prefix } = opt;
	const rows2 = await cache_query(`SELECT source,user_id FROM ${prefix}source_code WHERE solution_id=?`, [sid]);
	const user_id = rows2[0].user_id;
	if (!req.session.isadmin && user_id !== req.session.user_id) {
		res.json(error.noprivilege);
	} else {
		obj.code = rows2[0].source;
		cache.set("source/id/" + source + id + "/" + sid, obj, 10 * 24 * 60 * 60);
		res.json(obj);
	}
}

router.get("/:source/:id/:sid", async function (req: any, res: any) {
	const source = req.params.source === "local" ? "" : req.params.source.toUpperCase();
	const id = parseInt(req.params.id);
	const sid = parseInt(req.params.sid);
	const _res = cache.get("source/id/" + source + id + "/" + sid);
	if (_res === undefined) {
		if (source.length === 0) {
			await getSourceCode(req, res, (await ProblemInfoManager.newInstance().setProblemId(id).find()).get(), {
				id,
				sid,
				source
			});
		} else {
			await getSourceCode(req, res, await cache_query("SELECT * FROM vjudge_problem WHERE problem_id=? AND source=?",
				[id, source])[0], { id, sid, source, prefix: "vjudge_" });
		}
	} else {
		res.json(_res);
	}
});

export = ["/problem", auth, router];
