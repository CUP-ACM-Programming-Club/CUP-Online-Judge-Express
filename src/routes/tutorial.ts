/* eslint-disable no-console */
import TutorialInterceptor from "../module/tutorial/interceptor";

import express from "express";
const router = express.Router();
import auth from "../middleware/auth";
import TutorialService from "../service/TutorialService";
const { checkCaptcha } = require("../module/captcha_checker");
const { error, ok } = require("../module/constants/state");
const const_variable = require("../module/const_name");
const checkSourceId = (req: any) => {
	const source = req.params.source;
	let id = req.params.id;
	if (isNaN(id)) {
		return false;
	}
	return { source: source.toUpperCase(), id };
};

router.get("/:source/:id", async (req: any, res: any) => {
	const _sourceId: any = checkSourceId(req);
	const source = _sourceId.source;
	const id = _sourceId.id;
	try {
		const data = await TutorialService.getTutorialList(source, id, req.session.user_id);
		res.json({
			status: "OK",
			data: data,
			self: req.session.user_id,
			const_variable: {
				judge_color: const_variable.judge_color,
				language_name: const_variable.language_name.local,
				icon_list: const_variable.icon_list,
				result: const_variable.result.cn,
				language_common_name: const_variable.language_name.common
			}
		});
	} catch (e) {
		res.json(error.database);
		console.log(e);
	}
});

const getTutorialController = async (req: any, res: any, opt: any = {}) => {
	try {
		let tutorial_id = opt.tid;
		if (typeof tutorial_id !== "undefined" && isNaN(tutorial_id)) {
			res.json(error.invalidParams);
			return;
		}
		const data = await TutorialService.getTutorial(tutorial_id);
		if (data && data.length > 0) {
			if (data.length === 1) {
				res.json({ status: "OK", data: data[0] });
			} else {
				res.json({ status: "OK", data });
			}
		} else {
			res.json({ status: "OK", data: { solution_id: null, content: null } });
		}
	} catch (e) {
		res.json(error.database);
		console.log(e);
	}
};

router.get("/:tutorial_id", async (req: any, res: any) => {
	getTutorialController(req, res, { tid: req.params.tutorial_id });
});

router.get("/", async (req: any, res: any) => {
	getTutorialController(req, res);
});

router.post("/new/:source/:id", async (req: any, res: any) => {
	checkCaptcha(req, "tutorial");
	const _sourceId: any = checkSourceId(req);
	const source = _sourceId.source;
	const id = _sourceId.id;
	const content = req.body.content;
	const solution_id = req.body.solution_id;

	try {
		const validSolution = await TutorialService.checkSolutionId(solution_id, id, source === "LOCAL", source);
		const isOwner = await TutorialService.checkOwner(solution_id, req.session.user_id);

		if (validSolution && isOwner) {
			await TutorialService.createTutorial(source, id, req.session.user_id, solution_id, content);
			res.json(ok.serverReceived);
		} else {
			res.json(error.solutionIdNotValid);
		}
	} catch (err) {
		res.json(error.database);
		console.log(err);
	}
});

router.post("/edit/:tutorial_id", async (req: any, res: any) => {
	try {
		checkCaptcha(req, "tutorial");
		let tid = req.params.tutorial_id;
		if (isNaN(tid)) {
			res.json(error.invalidParams);
			return;
		}
		const content = req.body.content;
		const solution_id = req.body.solution_id;
		const sourceProblemId = await TutorialService.getSourceProblemId(tid);
		const { source, problem_id } = sourceProblemId;

		const validSolution = await TutorialService.checkSolutionId(solution_id, problem_id, source.toUpperCase() === "LOCAL", source);
		const isOwner = await TutorialService.checkOwner(solution_id, req.session.user_id);
		const isTutorialOwner = await TutorialService.checkTutorialOwner(tid, req.session.user_id);

		if (!validSolution || !isOwner) {
			res.json(error.solutionIdNotValid);
		} else if (!isTutorialOwner && !req.session.isadmin) {
			res.json(error.noprivilege);
		} else {
			await TutorialService.updateTutorial(content, solution_id, tid);
			res.json(ok.serverReceived);
		}
	} catch (e: any) {
		res.json(error.errorMaker(e));
	}
});

export = ["/tutorial", auth, TutorialInterceptor, router];
