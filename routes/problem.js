const express = require("express");
//const NodeCache = require('node-cache');
//const cache = new NodeCache({stdTTL: 10 * 24 * 60 * 60, checkperiod: 15 * 24 * 60 * 60});
let cachePack = {};
const md = require("markdown-it")({
	html: true,
	breaks: true
});
const mh = require("markdown-it-highlightjs");
const mk = require("markdown-it-katex");
md.use(mk);
md.use(mh);
const cache = require("../module/cachePool");
const router = express.Router();
const log4js = require("../module/logger");
const logger = log4js.logger("cheese", "info");
const query = require("../module/mysql_query");
const cache_query = require("../module/mysql_cache");
const const_variable = require("../module/const_name");
const send_json = (res, val) => {
	if (res !== null) {
		res.header("Content-Type", "application/json");
		res.json(val);
	}
};

const check = (req, cid) => {
	return req.session.isadmin || req.session.contest[cid] || req.session.contest_maker[cid];
};

const markdownPack = (html) => {
	return ["<div class=\"markdown-body\">", html, "</div>"].join("");
};

const problem_callback = (rows, req, res, opt = {source: "", sid: -1, raw: false}) => {
	let packed_problem;
	if (rows.length !== 0) {
		if (!opt.raw && (packed_problem = cachePack[opt.id])) {
			new Promise((resolve) => {
				let _packed_problem = Object.assign({}, rows[0]);
				_packed_problem.language_name = const_variable.language_name[opt.source.toLowerCase() || "local"];
				_packed_problem.language_template = const_variable.language_template[opt.source.toLowerCase() || "local"];
				_packed_problem.prepend = opt.prepend;
				_packed_problem.append = opt.append;
				if (opt.source) {
					_packed_problem.input = markdownPack(md.render(_packed_problem.input));
					_packed_problem.output = markdownPack(md.render(_packed_problem.output));
					_packed_problem.description = markdownPack(md.render(_packed_problem.description));
					_packed_problem.hint = markdownPack(md.render(_packed_problem.hint));
				}
				_packed_problem.langmask = opt.langmask || const_variable.langmask;
				cachePack[opt.id] = _packed_problem;
				resolve();
			});
		}
		else {
			packed_problem = Object.assign({}, rows[0]);
			packed_problem.language_name = const_variable.language_name[opt.source.toLowerCase() || "local"];
			packed_problem.language_template = const_variable.language_template[opt.source.toLowerCase() || "local"];
			packed_problem.prepend = opt.prepend;
			packed_problem.append = opt.append;
			if (!opt.raw && !opt.source) {
				packed_problem.input = markdownPack(md.render(packed_problem.input));
				packed_problem.output = markdownPack(md.render(packed_problem.output));
				packed_problem.description = markdownPack(md.render(packed_problem.description));
				packed_problem.hint = markdownPack(md.render(packed_problem.hint));
			}
			packed_problem.langmask = opt.langmask || const_variable.langmask;
		}
		if (~opt.solution_id) {
			cache_query(`SELECT source FROM source_code_user WHERE solution_id = ?
			${req.session.isadmin?"":" AND solution_id in (select solution_id from solution where user_id = ?)"}`, [opt.solution_id,req.session.user_id])
				.then(resolve => {
					send_json(res, {
						problem: packed_problem,
						source: resolve?resolve[0]?resolve[0].source:"":""
					});
				});
		}
		else {
			send_json(res, {
				problem: packed_problem,
				source: ""
			});
			cache.set("source/id/" + opt.source + opt.problem_id + opt.sql, packed_problem, 60 * 60);
		}
	}
	else {
		const obj = {
			status: "error",
			statement: "problem not found"
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
			}
			const result = {
				items: rows
			};
			send_json(res, result);
			cache.set("/module/search/" + req.session.isadmin + val, result, 10 * 24 * 60 * 60);
		});
	}
	else {
		send_json(res, _res);
	}
});

router.get("/:source/:id", function (req, res, next) {
	const id = parseInt(req.params.id);
	if (isNaN(id)) {
		next();
	}
	else {
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
	}
	else {
		next("route");
	}
}, function (req, res) {
	const errmsg = {
		status: "error",
		statement: "invalid parameter id or sid"
	};
	send_json(res, errmsg);
});

const make_cache = async (res, req, opt = {source: "", raw: false}) => {
	logger.info(opt.problem_id);
	let sql;
	const _prepend = await cache_query("SELECT * FROM prefile WHERE problem_id = ?", [opt.problem_id]);
	let new_langmask = 0;
	for (let i of _prepend) {
		if (parseInt(i.prepend) === 1) {
			if (!opt.prepend) {
				opt.prepend = {};
			}
			opt.prepend[parseInt(i.type)] = i.code;
		}
		else {
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
			sql = "SELECT * FROM problem WHERE problem_id=?";
			opt.sql = sql;
			cache_query(sql, [opt.problem_id])
				.then((rows) => {
					problem_callback(rows, req, res, opt);
				});
		}
		else {
			sql = "SELECT * FROM vjudge_problem WHERE problem_id=? AND source=?";
			opt.sql = sql;
			cache_query(sql, [opt.problem_id, opt.source])
				.then((rows) => {
					problem_callback(rows, req, res, opt);
				});
		}
	}
	else {
		if (opt.source.length === 0) {
			sql = `SELECT * FROM problem WHERE problem_id = ?
			        AND defunct = 'N' AND problem_id NOT IN (
			        select problem_id from contest_problem
			where oj_name is null and contest_id in (select contest_id from contest where defunct='N' and (end_time>NOW() or private=1)))`;
			opt.sql = sql;
			cache_query(sql, [opt.problem_id])
				.then(rows => {
					problem_callback(rows, req, res, opt);
				});
		}
		else {
			sql = `SELECT * FROM vjudge_problem WHERE problem_id = ? and source = ? and defunct = 'N' 
			and CONCAT(problem_id,source) NOT IN (SELECT CONCAT(problem_id,source) FROM contest_problem 
			where  contest_id IN (SELECT contest_id FROM contest WHERE end_time > NOW()
			OR private = 1))`;
			opt.sql = sql;
			cache_query(sql, [opt.problem_id, opt.source])
				.then(rows => {
					problem_callback(rows, req, res, opt);
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
	}
	else {
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
	let raw = req.query.raw !== undefined;
	if (~cid && ~pid && check(req, cid)) {
		const result = await cache_query("SELECT * FROM contest_problem WHERE contest_id = ? and " +
			"num = ?", [cid, pid]);
		if (result.length > 0) {
			const _langmask = await cache_query("SELECT langmask FROM contest WHERE contest_id = ?", [cid]);
			let problem_id = result[0].problem_id;
			let langmask = _langmask[0].langmask;
			make_cache(res, req, {
				problem_id: problem_id,
				source: source,
				solution_id: sid,
				raw: raw,
				langmask: langmask
			});
		}
		else {
			res.json({
				status: "error",
				statement: "invalid parameter id"
			});
		}
	}
	else if (~tid && ~pid) {
		const result = await cache_query("SELECT * FROM special_subject_problem WHERE topic_id = ? and " +
			"num = ?", [tid, pid]);
		if (result.length > 0) {
			let problem_id = result[0].problem_id;
			make_cache(res, req, {problem_id: problem_id, source: source, solution_id: sid, raw: raw});
		}
		else {
			res.json({
				status: "error",
				statement: "invalid parameter id"
			});
		}
	}
	else if (~id) {
		make_cache(res, req, {problem_id: id, source: source, solution_id: sid, raw: raw});
	}
	else {
		res.json({
			status: "error",
			statement: "invalid parameter id"
		});
	}
});

router.post("/:source/:id", function (req, res) {
	const problem_id = parseInt(req.params.id);
	if (req.session.isadmin) {
		let json;
		try {
			json = req.body.json;
			query(`update problem set title = ?,time_limit = ?,memory_limit = ?,description = ?,input = ?,output = ?,
			sample_input = ?,sample_output = ?,hint = ? where problem_id = ?`,
				[json.title, json.time, json.memory, json.description, json.input,
					json.output, json.sampleinput, json.sampleoutput, json.hint,
					problem_id])
				.then(() => {
				})
				.catch(err => {
					logger.fatal(err);
				});
			send_json(res, {
				status: "OK"
			});
		}
		catch (e) {
			logger.fatal(e);
			send_json(res, {
				status: "error",
				statement: "parse error"
			});
		}
	}
	else {
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
					}
					else {
						let obj = rows[0];
						obj.code = rows2[0].source;
						cache.set("source/id/" + source + id + "/" + sid, rows[0], 10 * 24 * 60 * 60);
						send_json(res, obj);
					}
				});
			});
		}
		else {
			query("SELECT * FROM vjudge_problem WHERE problem_id=? AND source=?", [id, source])
				.then(async (rows) => {
					await query("SELECT source,user_id FROM vjudge_source_code WHERE solution_id=?", [sid])
						.then(async (rows2) => {
							const user_id = rows2[0].user_id;
							if (!req.session.isadmin && user_id !== req.session.user_id) {
								send_json(res, no_privilege);
							}
							else {
								let obj = rows[0];
								obj.code = rows2[0].source;
								cache.set("source/id/" + source + id + "/" + sid, rows[0], 10 * 24 * 60 * 60);
								send_json(res, obj);
							}
						});
				});
		}
	}
	else {
		send_json(res, _res);
	}
});


module.exports = router;
