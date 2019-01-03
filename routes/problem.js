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
const [error] = require("../module/const_var");

const send_json = (res, val) => {
	if (res !== null) {
		res.header("Content-Type", "application/json");
		res.json(val);
	}
};

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

const checkContestPrivilege = (req, cid) => {
	return req.session.isadmin || req.session.source_browser || req.session.contest[`c${cid}`] || req.session.contest_maker[`m${cid}`];
};

const problem_callback = (rows, req, res, opt = {source: "", sid: -1, raw: false}, copyVal = {}) => {
	let packed_problem = {};
	if (rows.length !== 0) {
		if (!opt.raw && (packed_problem = cachePack[opt.id])) {
			new Promise((resolve) => {
				let _packed_problem = Object.assign({}, rows[0]);
				_packed_problem.language_name = const_variable.language_name[opt.source.toLowerCase() || "local"];
				_packed_problem.language_template = const_variable.language_template[opt.source.toLowerCase() || "local"];
				_packed_problem.prepend = opt.prepend;
				_packed_problem.append = opt.append;
				_packed_problem.uploader = opt.uploader;
				_packed_problem.langmask = opt.langmask || const_variable.langmask;
				cachePack[opt.id] = _packed_problem;
				resolve();
			});
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
					send_json(res, Object.assign({
						problem: packed_problem,
						source: resolve ? resolve[0] ? resolve[0].source : "" : "",
						isadmin: req.session.isadmin,
						browse_code: req.session.source_browser,
						editor: req.session.editor || false
					}, copyVal));
				});
		} else {
			send_json(res, Object.assign({
				problem: packed_problem,
				source: "",
				isadmin: req.session.isadmin,
				browse_code: req.session.source_browser,
				editor: req.session.editor || false
			}, copyVal));
			cache.set("source/id/" + opt.source + opt.problem_id + opt.sql, packed_problem, 60 * 60);
		}
	} else {
		const obj = {
			status: "error",
			statement: "problem not found or not a public problem"
		};
		send_json(res, obj);
	}
};

const no_privilege = {
	status: "error",
	statement: "Permission Denied"
};

router.get("/module/search/:val", function (req, res) {
	const val = "%" + req.params.val + "%";
	const _res = cache.get("/module/search/" + req.session.isadmin + val);
	if (_res === undefined) {
		if (val.length < 3) {
			const obj = {
				msg: "ERROR",
				statement: "Value too short!"
			};
			send_json(res, obj);
			return;
		}
		query("SELECT * FROM problem WHERE " + (req.session.isadmin ? "" : " defunct='N' AND") +
			" problem_id LIKE ? OR title LIKE ? OR source LIKE ? OR description LIKE ? OR label LIKE ?", [val, val, val, val, val], function (rows) {
			for (let i in rows) {
				rows[i]["url"] = "/newsubmitpage.php?id=" + rows[i]["problem_id"];
				rows[i].source = cheerio.load(rows[i].source).text();
			}
			const result = {
				items: rows
			};
			send_json(res, result);
			cache.set("/module/search/" + req.session.isadmin + val, result, 10 * 24 * 60 * 60);
		});
	} else {
		send_json(res, _res);
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
	const errmsg = {
		status: "error",
		statement: "invalid parameter id"
	};
	send_json(res, errmsg);
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
	const errmsg = {
		status: "error",
		statement: "invalid parameter id or sid"
	};
	send_json(res, errmsg);
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
	let sql;
	const _prepend = await cache_query("SELECT * FROM prefile WHERE problem_id = ?", [opt.problem_id]);
	let new_langmask = 0;
	for (let i of _prepend) {
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
	if (req.session.isadmin) {
		if (opt.source.length === 0) {
			sql = `select a.*,privilege.user_id as creator
from (SELECT * FROM problem WHERE problem_id = ?)a
       left join privilege on privilege.rightstr = CONCAT('p', '?')`;
			opt.sql = sql;
			cache_query(sql, [opt.problem_id, opt.problem_id])
				.then((rows) => {
					problem_callback(rows, req, res, opt, copyVal);
				});
		} else {
			sql = "SELECT * FROM vjudge_problem WHERE problem_id=? AND source=?";
			opt.sql = sql;
			cache_query(sql, [opt.problem_id, opt.source])
				.then((rows) => {
					problem_callback(rows, req, res, opt, copyVal);
				});
		}
	} else {
		if (opt.source.length === 0) {
			sql = "SELECT * FROM problem WHERE problem_id = ?";
			opt.sql = sql;
			cache_query(sql, [opt.problem_id])
				.then(rows => {
					problem_callback(rows, req, res, opt, copyVal);
				});
		} else {
			sql = `SELECT * FROM vjudge_problem WHERE problem_id = ? and source = ? 
			and CONCAT(problem_id,source) NOT IN (SELECT CONCAT(problem_id,source) FROM contest_problem 
			where  contest_id IN (SELECT contest_id FROM contest WHERE end_time > NOW()
			OR private = 1))`;
			opt.sql = sql;
			cache_query(sql, [opt.problem_id, opt.source])
				.then(rows => {
					problem_callback(rows, req, res, opt, copyVal);
				});
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
		send_json(res, _res);
		make_cache(null, req, {problem_id: id, source: source});
	}
});

router.get("/:source/", async function (req, res) {
	const source = req.params.source === "local" ? "" : req.params.source.toUpperCase();
	let cid = req.query.cid === undefined ? -1 : req.query.cid;
	let tid = req.query.tid === undefined ? -1 : req.query.tid;
	let pid = req.query.pid === undefined ? -1 : req.query.pid;
	let id = req.query.id === undefined ? -1 : req.query.id;
	let sid = req.query.sid === undefined ? -1 : req.query.sid;
	let labels = req.query.label !== undefined;
	let raw = req.query.raw !== undefined;
	[cid, tid, pid, id, sid] = judgeValidNumber([cid, tid, pid, id, sid]);
	if (~cid && ~pid) {
		const [contest, result, limit_hostname] = await Promise.all([cache_query("SELECT * FROM contest WHERE contest_id = ?", [cid]), cache_query("SELECT * FROM contest_problem WHERE contest_id = ? and " +
			"num = ?", [cid, pid]), cache_query("select limit_hostname from contest where contest_id = ?", [cid])]);
		if (!checkPrivilege(req)) {
			if (global.contest_mode) {
				if (contest[0].cmod_visible === 0) {
					res.json(error.contestMode);
					return;
				}
			}
		}
		if (contest[0].private === 1 && !checkContestPrivilege(req, cid)) {
			res.json(error.problemInContest);
			return;
		}
		if (result.length > 0) {
			const _langmask = await cache_query("SELECT langmask,end_time FROM contest WHERE contest_id = ?", [cid]);
			let problem_id = result[0].problem_id;
			let langmask = _langmask[0].langmask;
			let end_time = _langmask[0].end_time;
			make_cache(res, req, {
				problem_id: problem_id,
				source: source,
				solution_id: sid,
				raw: raw,
				langmask: langmask,
				after_contest: dayjs().isAfter(dayjs(end_time))
			}, {limit_hostname: limit_hostname[0].limit_hostname});
		} else {
			res.json({
				status: "error",
				statement: "invalid parameter id"
			});
		}
	} else if (~tid && ~pid) {
		if (!checkPrivilege(req) && global.contest_mode) {
			res.json(error.contestMode);
			return;
		}
		const result = await cache_query("SELECT * FROM special_subject_problem WHERE topic_id = ? and " +
			"num = ?", [tid, pid]);
		if (result.length > 0) {
			let problem_id = result[0].problem_id;
			make_cache(res, req, {
				problem_id: problem_id,
				source: source,
				solution_id: sid,
				raw: raw,
				after_contest: true
			});
		} else {
			res.json({
				status: "error",
				statement: "invalid parameter id"
			});
		}
	} else if (~id) {
		const browse_privilege = checkPrivilege(req);
		if (!browse_privilege && global.contest_mode) {
			res.json(error.contestMode);
			return;
		}
		if (browse_privilege) {
			make_cache(res, req, {
				problem_id: id,
				source: source,
				solution_id: sid,
				raw: raw,
				after_contest: true,
				uploader: await checkUploader(id)
			});
		} else {
			const _end_time = await cache_query(`select UNIX_TIMESTAMP(end_time) as t from contest where contest_id in (select contest_id from contest_problem
		 where problem_id = ?)`, [id]);
			if (_end_time.length > 0) {
				const end_time = dayjs(_end_time[0].t * 1000);
				if (dayjs().isBefore(end_time)) {
					res.json(error.problemInContest);
				} else {
					make_cache(res, req, {
						problem_id: id,
						source: source,
						solution_id: sid,
						raw: raw,
						after_contest: true,
						uploader: await checkUploader(id)
					});

				}
			} else {
				make_cache(res, req, {
					problem_id: id,
					source: source,
					solution_id: sid,
					raw: raw,
					after_contest: true,
					uploader: await checkUploader(id)
				});
			}
		}

	} else if (labels) {
		let vjudge = req.query.vjudge !== undefined ? "vjudge_" : "";
		cache_query(`select label_name from ${vjudge}label_list`)
			.then(rows => {
				let data = [];
				for (let i of rows) {
					data.push(i.label_name);
				}
				res.json({
					status: "OK",
					data: data
				});
			});
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

			})
			.catch(() => {
			});
	} else {
		res.json({
			status: "error",
			statement: "invalid parameter id"
		});
	}

})
;

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
				.then(() => {
				})
				.catch(err => {
					if (ENVIRONMENT === "test") {
						console.error(`${path.basename(__filename)} line 414:`);
						console.error(err);
					} else {
						logger.fatal(err);
					}
				});
			send_json(res, {
				status: "OK"
			});
		} catch (e) {
			logger.fatal(e);
			send_json(res, {
				status: "error",
				statement: "parse error"
			});
		}
	} else {
		send_json(res, {
			status: "error",
			statement: "illegal request"
		});
	}
});

router.get("/:source/:id/:sid", function (req, res) {
	const source = req.params.source === "local" ? "" : req.params.source.toUpperCase();
	const id = parseInt(req.params.id);
	const sid = parseInt(req.params.sid);
	const _res = cache.get("source/id/" + source + id + "/" + sid);
	if (_res === undefined) {
		if (source.length === 0) {
			query("SELECT * FROM problem WHERE problem_id=?", [id]).then(async (rows) => {
				await query("SELECT source,user_id FROM source_code WHERE solution_id=?", [sid]).then(async (rows2) => {
					const user_id = rows2[0].user_id;
					if (!req.session.isadmin && user_id !== req.session.user_id) {
						send_json(res, no_privilege);
					} else {
						let obj = rows[0];
						obj.code = rows2[0].source;
						cache.set("source/id/" + source + id + "/" + sid, rows[0], 10 * 24 * 60 * 60);
						send_json(res, obj);
					}
				});
			});
		} else {
			query("SELECT * FROM vjudge_problem WHERE problem_id=? AND source=?", [id, source])
				.then(async (rows) => {
					await query("SELECT source,user_id FROM vjudge_source_code WHERE solution_id=?", [sid])
						.then(async (rows2) => {
							const user_id = rows2[0].user_id;
							if (!req.session.isadmin && user_id !== req.session.user_id) {
								send_json(res, no_privilege);
							} else {
								let obj = rows[0];
								obj.code = rows2[0].source;
								cache.set("source/id/" + source + id + "/" + sid, rows[0], 10 * 24 * 60 * 60);
								send_json(res, obj);
							}
						});
				});
		}
	} else {
		send_json(res, _res);
	}
});


module.exports = ["/problem", auth, router];
