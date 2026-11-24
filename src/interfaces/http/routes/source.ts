import { isAdmin } from "../../../domain/policy/predicates";
const { error } = require("../../../domain/constants/state");
import SubmissionViewUseCases from "../../../application/submission/SubmissionViewUseCases";

import express from "express";
const md = require("markdown-it")({
	html: true,
	breaks: true
});
const mh = require("markdown-it-highlightjs");
md.use(mh);
const router = express.Router();
import auth from "../middleware/auth";
const cnameList = require("../../../domain/constants/const_name");
const const_name = cnameList.markdown_language;
const language_name = cnameList.language_name;
const result = cnameList.result.cn;
const judge_color = cnameList.judge_color;
const icon_list = cnameList.icon_list;
const markdownPack = (html: any) => {
	return `<div class="markdown-body">${html}</div>`;
};


const make_code = (data: any, source: any = "local") => {
	return markdownPack(md.render(["```" + const_name[source.toLowerCase()][data.language], data.source, "```"].join("\n")));
};

router.get("/:source/:id", async (req: any, res: any, next: any) => {
	const id = isNaN(Number(req.params.id)) ? -1 : parseInt(req.params.id);
	if (!await SubmissionViewUseCases.checkSourcePrivilege(req.session, id)) {
		if (global.contest_mode) {
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

router.get("/:source/:id", async (req: any, res: any) => {
	const local = req.params.source === "local";
	const id = parseInt(req.params.id);
	const raw = !!req.query.raw;
	const browse_code = await SubmissionViewUseCases.checkSourcePrivilege(req.session as any, id);
	const [data, _source] = await SubmissionViewUseCases.getSourceView(local, id, browse_code, browse_code ? undefined : req.session.user_id);
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
			privilege: isAdmin(req)
		});
	}
});


module.exports = ["/source", auth, router];
