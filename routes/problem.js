/* eslint-disable no-console */
const express = require("express");
const dayjs = require("dayjs");
//const NodeCache = require('node-cache');
//const cache = new NodeCache({stdTTL: 10 * 24 * 60 * 60, checkperiod: 15 * 24 * 60 * 60});
let cachePack = {};
const md = require("markdown-it")({
	html: true,
	breaks: true
});
const mh = require("markdown-it-highlightjs");
const mk = require("@ryanlee2014/markdown-it-katex");
md.use(mk);
md.use(mh);
const cache = require("../module/cachePool");
const router = express.Router();
const log4js = require("../module/logger");
const logger = log4js.logger("cheese", "info");
const query = require("../module/mysql_query");
const cache_query = require("../module/mysql_cache");
const const_variable = require("../module/const_name");
const auth = require("../middleware/auth");
const cheerio = require("cheerio");
const ENVIRONMENT = process.env.NODE_ENV;
const path = require("path");
const [error, ok] = require("../module/const_var");


const checkEmpty = (str) => {
	if (str === "" || str === null) {
		return null;
	}
	return str;
};

const _judgeValidNumber = (num) => {
	if (isNaN(num)) {
		return -1;
	} else {
		return parseInt(num);
	}
};

const judgeValidNumber = (num) => {
	if (Array.isArray(num)) {
		let returnArr = [];
		for (let i of num) {
			returnArr.push(_judgeValidNumber(i));
		}
		return returnArr;
	} else {
		return _judgeValidNumber(num);
	}
};

const checkUploader = async (problem_id) => {
	const _uploader = await cache_query("SELECT user_id from privilege where rightstr = ?", ["p" + problem_id]);
	if (_uploader && _uploader.length > 0) {
		return _uploader[0].user_id;
	} else {
		return "Administrator";
	}
};

const checkPrivilege = (req) => {
	return req.session.isadmin || req.session.source_browser;
};

const checkProblemAvailable = async (problem_id) => {
	const data = await cache_query("select defunct from problem where problem_id = ?", [problem_id]);
	return !(!data || data.length === 0 || data[0].defunct === "Y");
};


const checkContestPrivilege = (req, cid) => {
	return req.session.isadmin || req.session.source_browser || req.session.contest[`c${cid}`] || req.session.contest_maker[`m${cid}`];
};

const maintainLabels = (vjudge) => {
	cache_query(`select label from ${vjudge}problem`)
		.then(rows => {
			let all_label = [];
			for (let i of rows) {
				if (typeof i.label === "string" && i.label.length > 0) {
					for (let j of i.label.split(" ")) {
						all_label.push(j);
					}
				}
			}
			const data = [...new Set(all_label)];
			(async () => {
				for (let i of data) {
					await query(`INSERT INTO ${vjudge}label_list (label_name)
SELECT * FROM (SELECT ?) AS tmp
WHERE NOT EXISTS (
    SELECT label_name FROM ${vjudge}label_list WHERE label_name = ?
) LIMIT 1;`, [i, i]);
				}
			})();
			return true;
		});
};

async function contestProblemHandler(httpInstance, val = {}) {
	let {req, res} = httpInstance;
	let {source, solution_id, raw, cid, pid} = val;
	const [contest, result] = await Promise.all([cache_query("SELECT * FROM contest WHERE contest_id = ?", [cid]), cache_query("SELECT * FROM contest_problem WHERE contest_id = ? and " +
		"num = ?", [cid, pid])]);
	if (!checkPrivilege(req)) {
		if (global.contest_mode && parseInt(contest[0].cmod_visible) === 0) {
			res.json(error.contestMode);
			return;
		}
	}
	if (parseInt(contest[0].private) === 1 && !checkContestPrivilege(req, cid)) {
		res.json(error.problemInContest);
		return;
	}
	if (result.length > 0) {
		let {langmask, end_time} = contest[0];
		let problem_id = result[0].problem_id;
		make_cache(res, req, {
			problem_id, source, solution_id, raw, langmask, after_contest: dayjs().isAfter(dayjs(end_time))
		}, {limit_hostname: contest[0].limit_hostname});
	} else {
		res.json(error.invalidParams);
	}
}

async function TopicProblemHandler(httpInstance, val = {}) {
	let {req, res} = httpInstance;
	let {tid, pid, source, solution_id, raw} = val;
	if (!checkPrivilege(req) && global.contest_mode) {
		res.json(error.contestMode);
		return;
	}
	const result = await cache_query("SELECT * FROM special_subject_problem WHERE topic_id = ? and " +
		"num = ?", [tid, pid]);
	if (result.length > 0) {
		let problem_id = result[0].problem_id;
		make_cache(res, req, {problem_id, source, solution_id, raw, after_contest: true});
	} else {
		res.json(error.invalidParams);
	}
}

async function normalProblemHandler(httpInstance, val = {}) {
	let {req, res} = httpInstance;
	let {id, source, solution_id, raw} = val;
	const browse_privilege = checkPrivilege(req);
	if (!browse_privilege) {
		if (global.contest_mode) {
			res.json(error.contestMode);
			return;
		} else if (!await checkProblemAvailable(id)) {
			res.json(error.errorMaker("problem not available!"));
			return;
		}
	}
	const parseData = [res, req, {
		problem_id: id,
		source,
		solution_id,
		raw,
		after_contest: true,
		uploader: await checkUploader(id)
	}];
	if (browse_privilege) {
		make_cache(...parseData);
	} else {
		const _end_time = await cache_query(`select UNIX_TIMESTAMP(end_time) as t from contest where contest_id in (select contest_id from contest_problem
		 where problem_id = ?)`, [id]);
		if (_end_time.length > 0 && dayjs().isBefore(dayjs(_end_time[0].t * 1000))) {
			res.json(error.problemInContest);
		} else {
			make_cache(...parseData);
		}
	}
}

async function labelHandler(httpInstance) {
	let {req, res} = httpInstance;
	let vjudge = req.query.vjudge !== undefined ? "vjudge_" : "";
	cache_query(`select label_name from ${vjudge}label_list`)
		.then(rows =>
			res.json({
				status: "OK",
				data: rows.map((val) => val.label_name)
			})
		);
	maintainLabels(vjudge);
}

function prependAppendHandler(dataArray, opt) {
	let new_langmask = 0;
	for (let i of dataArray) {
		if (parseInt(i.prepend) === 1) {
			if (!opt.prepend) {
				opt.prepend = {};
			}
			opt.prepend[parseInt(i.type)] = i.code;
		} else {
			if (!opt.append) {
				opt.append = {};
			}
			opt.append[parseInt(i.type)] = i.code;
		}
		new_langmask |= (1 << parseInt(i.type));
	}
	if (new_langmask) {
		opt.langmask = ~new_langmask;
	}
}

const problem_callback = (rows, req, res, opt = {source: "", sid: -1, raw: false}, copyVal = {}) => {
	let packed_problem = {};
	if (rows.length !== 0) {
		if (!opt.raw && (packed_problem = cachePack[opt.id])) {
			let _packed_problem = Object.assign({}, rows[0]);
			_packed_problem.language_name = const_variable.language_name[opt.source.toLowerCase() || "local"];
			_packed_problem.language_template = const_variable.language_template[opt.source.toLowerCase() || "local"];
			_packed_problem.prepend = opt.prepend;
			_packed_problem.append = opt.append;
			_packed_problem.uploader = opt.uploader;
			_packed_problem.langmask = opt.langmask || const_variable.langmask;
			cachePack[opt.id] = _packed_problem;
		} else {
			packed_problem = Object.assign({}, rows[0]);
			packed_problem.language_name = const_variable.language_name[opt.source.toLowerCase() || "local"];
			packed_problem.language_template = const_variable.language_template[opt.source.toLowerCase() || "local"];
			packed_problem.prepend = opt.prepend;
			packed_problem.append = opt.append;
			packed_problem.uploader = opt.uploader;
			packed_problem.langmask = opt.langmask || const_variable.langmask;
		}
		if (!opt.after_contest) {
			packed_problem.source = "";
		}
		if (~opt.solution_id) {
			const browse_privilege = req.session.isadmin || req.session.source_browser;
			cache_query(`SELECT source FROM source_code_user WHERE solution_id = ?
			${browse_privilege ? "" : " AND solution_id in (select solution_id from solution where user_id = ? or if((share = 1\n" +
				"           and not exists\n" +
				"           (select * from contest where contest_id in\n" +
				"           (select contest_id from contest_problem\n" +
				"           where solution.problem_id = contest_problem.problem_id)\n" +
				"          and end_time > NOW()) ),1,0))"}`, [opt.solution_id, req.session.user_id])
				.then(resolve => {
					res.json(Object.assign({
						problem: packed_problem,
						source: resolve ? resolve[0] ? resolve[0].source : "" : "",
						isadmin: req.session.isadmin,
						browse_code: req.session.source_browser,
						editor: req.session.editor || false
					}, copyVal));
				});
		} else {
			res.json(Object.assign({
				problem: packed_problem,
				source: "",
				isadmin: req.session.isadmin,
				browse_code: req.session.source_browser,
				editor: req.session.editor || false
			}, copyVal));
			cache.set("source/id/" + opt.source + opt.problem_id + opt.sql, packed_problem, 60 * 60);
		}
	} else {
		res.json(error.errorMaker("problem not found or not a public problem"));
	}
};


router.get("/module/search/:val", function (req, res) {
	const val = "%" + req.params.val + "%";
	const _res = cache.get("/module/search/" + req.session.isadmin + val);
	if (_res === undefined) {
		if (val.length < 3) {
			res.json(error.errorMaker("Value too short!"));
			return;
		}
		query(`SELECT * FROM problem WHERE ${(req.session.isadmin ? "" : " defunct='N' AND")} 
			 problem_id LIKE ? OR title LIKE ? OR source LIKE ? OR description LIKE ? OR label LIKE ?`, [val, val, val, val, val], function (rows) {
			for (let i in rows) {
				rows[i]["url"] = "/newsubmitpage.php?id=" + rows[i]["problem_id"];
				rows[i].source = cheerio.load(rows[i].source).text();
			}
			const result = {
				items: rows
			};
			res.json(result);
			cache.set("/module/search/" + req.session.isadmin + val, result, 10 * 24 * 60 * 60);
		});
	} else {
		res.json(_res);
	}
});

router.get("/:source/:id", function (req, res, next) {
	const id = parseInt(req.params.id);
	if (isNaN(id)) {
		next();
	} else {
		next("route");
	}
}, function (req, res) {
	res.json(error.invalidParams);
});

router.get("/:source/:id/:sid", function (req, res, next) {
	const id = parseInt(req.params.id);
	const sid = parseInt(req.params.sid);
	if (isNaN(sid) || isNaN(id)) {
		next();
	} else {
		next("route");
	}
}, function (req, res) {
	res.json(error.invalidParams);
});

const make_cache = async (res, req, opt = {
	source: "",
	raw: false,
	after_contest: false,
	uploader: "Administrator"
}, copyVal = {}) => {
	if (ENVIRONMENT === "test") {
		console.log(`${path.basename(__filename)} line 208:Problem_ID:${opt.problem_id}`);
	} else {
		logger.info(opt.problem_id);
	}
	prependAppendHandler(await cache_query("SELECT * FROM prefile WHERE problem_id = ?", [opt.problem_id]), opt);
	if (req.session.isadmin) {
		if (opt.source.length === 0) {
			opt.sql = `select a.*,privilege.user_id as creator
from (SELECT * FROM problem WHERE problem_id = ?)a
       left join privilege on privilege.rightstr = CONCAT('p', '?')`;
			cache_query(opt.sql, [opt.problem_id, opt.problem_id]).then((rows) => problem_callback(rows, req, res, opt, copyVal));
		} else {
			opt.sql = "SELECT * FROM vjudge_problem WHERE problem_id=? AND source=?";
			cache_query(opt.sql, [opt.problem_id, opt.source]).then((rows) => problem_callback(rows, req, res, opt, copyVal));
		}
	} else {
		if (opt.source.length === 0) {
			opt.sql = "SELECT * FROM problem WHERE problem_id = ?";
			cache_query(opt.sql, [opt.problem_id]).then(rows => problem_callback(rows, req, res, opt, copyVal));
		} else {
			opt.sql = `SELECT * FROM vjudge_problem WHERE problem_id = ? and source = ? 
			and CONCAT(problem_id,source) NOT IN (SELECT CONCAT(problem_id,source) FROM contest_problem 
			where  contest_id IN (SELECT contest_id FROM contest WHERE end_time > NOW()
			OR private = 1))`;
			cache_query(opt.sql, [opt.problem_id, opt.source]).then(rows => problem_callback(rows, req, res, opt, copyVal));
		}
	}
};

router.get("/:source/:id", function (req, res) {
	const source = req.params.source === "local" ? "" : req.params.source.toUpperCase();
	const id = parseInt(req.params.id);
	const _res = cache.get("source/id/" + source + id);
	if (_res === undefined) {
		make_cache(res, req, {problem_id: id, source: source});
	} else {
		res.json(_res);
		make_cache(null, req, {problem_id: id, source: source});
	}
});

function queryValidate(val) {
	let returnVal = {};
	for (let i in val) {
		returnVal[i] = val[i] === undefined ? -1 : val[i];
	}
	return returnVal;
}


router.get("/:source/", async function (req, res) {
	const source = req.params.source === "local" ? "" : req.params.source.toUpperCase();
	let {cid, tid, pid, id, sid: solution_id} = queryValidate(req.query);
	let labels = req.query.label !== undefined;
	let raw = req.query.raw !== undefined;
	[cid, tid, pid, id, solution_id] = judgeValidNumber([cid, tid, pid, id, solution_id]);
	if (~cid && ~pid) {
		contestProblemHandler({req, res}, {source, solution_id, raw, cid, pid});
	} else if (~tid && ~pid) {
		TopicProblemHandler({req, res}, {tid, pid, source, solution_id, raw});
	} else if (~id) {
		normalProblemHandler({req, res}, {id, source, solution_id, raw});
	} else if (labels) {
		labelHandler({req, res});
	} else {
		res.json(error.invalidParams);
	}
});

router.post("/:source/:id", function (req, res) {
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
				spj: 0
			}, req.body.json);
			let sql = `update ${local ? "" : "vjudge_"}problem set title = ?,time_limit = ?,
			memory_limit = ?,description = ?,input = ?,output = ?,
			sample_input = ?,sample_output = ?,label = ?${local ? " ,hint = ? " : ""} where problem_id = ?
			 ${local ? "" : " and source = ?"}`;
			let sqlArr = [json.title, checkEmpty(json.time), checkEmpty(json.memory), json.description, json.input,
				json.output, json.sampleinput, json.sampleoutput, json.label];
			if (local) {
				sqlArr.push(json.hint,
					problem_id);
			} else {
				sqlArr.push(problem_id, from);
			}
			query(sql, sqlArr)
				.catch(err => {
					if (ENVIRONMENT === "test") {
						console.error(`${path.basename(__filename)} line 414:`);
						console.error(err);
					} else {
						logger.fatal(err);
					}
				});
			res.json(ok.ok);
		} catch (e) {
			logger.fatal(e);
			res.json(error.errorMaker("parse error"));
		}
	} else {
		res.json(error.errorMaker("illegal request"));
	}
});

async function getSourceCode(req, res, obj, opt = {}) {
	opt = Object.assign({prefix: "", id: 0, sid: 0, source: "LOCAL"}, opt);
	let {id, sid, source, prefix} = opt;
	const rows2 = await query(`SELECT source,user_id FROM ${prefix}source_code WHERE solution_id=?`, [sid]);
	const user_id = rows2[0].user_id;
	if (!req.session.isadmin && user_id !== req.session.user_id) {
		res.json(error.noprivilege);
	} else {
		obj.code = rows2[0].source;
		cache.set("source/id/" + source + id + "/" + sid, obj, 10 * 24 * 60 * 60);
		res.json(obj);
	}
}

router.get("/:source/:id/:sid", async function (req, res) {
	const source = req.params.source === "local" ? "" : req.params.source.toUpperCase();
	const id = parseInt(req.params.id);
	const sid = parseInt(req.params.sid);
	const _res = cache.get("source/id/" + source + id + "/" + sid);
	if (_res === undefined) {
		if (source.length === 0) {
			await getSourceCode(req, res, await query("SELECT * FROM problem WHERE problem_id=?", [id])[0], {
				id,
				sid,
				source
			});
		} else {
			await getSourceCode(req, res, await query("SELECT * FROM vjudge_problem WHERE problem_id=? AND source=?",
				[id, source])[0], {id, sid, source, prefix: "vjudge_"});
		}
	} else {
		res.json(_res);
	}
});


module.exports = ["/problem", auth, router];
