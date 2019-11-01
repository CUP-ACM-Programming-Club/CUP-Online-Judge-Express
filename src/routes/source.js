/* eslint-disable no-cond-assign */
const express = require("express");
//const NodeCache = require('node-cache');
//const cache = new NodeCache({stdTTL: 10 * 24 * 60 * 60, checkperiod: 15 * 24 * 60 * 60});
const md = require("markdown-it")({
	html: true,
	breaks: true
});
const mh = require("markdown-it-highlightjs");
md.use(mh);
const router = express.Router();
const query = require("../module/mysql_cache");
const auth = require("../middleware/auth");
const cnameList = require("../module/const_name");
const const_name = cnameList.markdown_language;
const language_name = cnameList.language_name;
const result = cnameList.result.cn;
const judge_color = cnameList.judge_color;
const icon_list = cnameList.icon_list;
const [error] = require("../module/const_var");
const markdownPack = (html) => {
	return `<div class="markdown-body">${html}</div>`;
};


const make_code = (data, source = "local") => {
	return markdownPack(md.render(["```" + const_name[source.toLowerCase()][data.language], data.source, "```"].join("\n")));
};

const checkPrivilege = (req) => {
	return req.session.isadmin || req.session.source_browser;
};

router.get("/:source/:id", (req, res, next) => {
	const id = isNaN(req.params.id) ? -1 : parseInt(req.params.id);
	if(!checkPrivilege(req)) {
		if(global.contest_mode) {
			res.json(error.contestMode);
			return;
		}
	}
	if (id === -1) {
		res.json({
			status: "error",
			statement: "id is not a number"
		});
	} else {
		next();
	}
});

router.get("/:source/:id", async (req, res) => {
	let local;
	const source = (local = req.params.source === "local") ? "source_code_user" : "vjudge_source_code";
	const solution = req.params.source === "local" ? "solution" : "vjudge_solution";
	const id = parseInt(req.params.id);
	const raw = !!req.query.raw;
	const browse_code = req.session.isadmin || req.session.source_browser;
	const sql = `select * from (select ${solution}.*,${source}.source from ${source} left join
  ${solution} on ${solution}.solution_id = ${source}.solution_id)tmp
where solution_id = ? ${browse_code ? "" : `and (user_id = ? or share = true or solution_id in 
(select solution_id from tutorial))`}`;
	// noinspection JSAnnotator
	const sqlArr = browse_code ? [id] : [id, req.session.user_id];
	let promiseArray = [];
	promiseArray.push(query(sql, sqlArr));
	if (!local) {
		promiseArray.push(query("select oj_name from vjudge_solution where solution_id = ?", [id]));
	}
	const [data, _source] = await Promise.all(promiseArray);
	if (data.length === 0) {
		res.json({
			status: "error",
			statement: "No such code or you don't have privilege"
		});
	} else {
		res.json({
			status: "OK",
			data: {
				code: raw ? data[0] : local ? make_code(data[0]) : make_code(data[0], _source[0].oj_name),
				problem: data[0].problem_id,
				user_id: data[0].user_id,
				language: language_name[data[0].oj_name ? data[0].oj_name.toLowerCase() : "local"][data[0].language],
				result: result[data[0].result],
				memory: data[0].memory,
				time: data[0].time,
				judge_color: judge_color[data[0].result],
				icon: icon_list[data[0].result],
				from: data[0].oj_name,
			},
			privilege: Boolean(req.session.isadmin)
		});
	}
});


module.exports = ["/source", auth, router];
