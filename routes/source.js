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
const markdownPack = (html) => {
	return `<div class="markdown-body">${html}</div>`;
};


const make_code = (data) => {
	return markdownPack(md.render(["```" + const_name.local[data.language], data.source, "```"].join("\n")));
};

router.get("/:source/:id", (req, res, next) => {
	const id = isNaN(req.params.id) ? -1 : parseInt(req.params.id);
	if (id === -1) {
		res.json({
			status: "error",
			statement: "id is not a number"
		});
	}
	else {
		next();
	}
});

router.get("/:source/:id", async (req, res) => {
	const source = req.params.source === "local" ? "source_code_user" : "vjudge_source_code";
	const solution = req.params.source === "local" ? "solution" : "vjudge_solution";
	const id = parseInt(req.params.id);
	const sql = `select * from (select ${solution}.*,${source}.source from ${source} left join
  ${solution} on ${solution}.solution_id = ${source}.solution_id)tmp
where solution_id = ? ${req.session.isadmin ? "" : "and user_id = ?"}`;
	// noinspection JSAnnotator
	const sqlArr = req.session.isadmin ? [id] : [id, req.session.user_id];
	const data = await query(sql, sqlArr);
	if (data.length === 0) {
		res.json({
			status: "error",
			statement: "No such code or you don't have privilege"
		});
	}
	else {
		res.json({
			status: "OK",
			data: {
				code: make_code(data[0]),
				problem: data[0].problem_id,
				user_id: data[0].user_id,
				language: language_name[data[0].oj_name ? data[0].oj_name.toLowerCase() : "local"][data[0].language],
				result: result[data[0].result],
				memory: data[0].memory,
				time: data[0].time,
				judge_color: judge_color[data[0].result],
				icon: icon_list[data[0].result],
				from: data[0].oj_name,
			}
		});
	}
});


module.exports = ["/source", auth, router];
