import ContestAssistantManager from "../../manager/contest/ContestAssistantManager";

import express from "express";
const router = express.Router();
const { error, ok } = require("../../module/constants/state");
const getProblemInfo = require("../../module/contest/problem");
const ProblemInfoManager = require("../../module/problem/ProblemInfoManager");

async function privilegeMiddleware(req: any, res: any, next: any) {
	const contestId = parseInt(req.params.contestId);
	if (req.session.isadmin || req.session.contest_manager || req.session.contest_maker[`m${contestId}`] || await ContestAssistantManager.userIsContestAssistant(contestId, req.session.user_id)) {
		next();
	}
	else {
		res.json(error.noprivilege);
	}
}

router.get("/:contestId", async (req: any, res: any) => {
	try {
		const contestId = parseInt(req.params.contestId);
		const contestProblemInfo = await getProblemInfo(contestId, false);
		const problemInfo = (await Promise
			.all(contestProblemInfo
				.map((e: any) => ProblemInfoManager
					.newInstance()
					.setProblemId(e.pid)
					.find()
				)
			)
		).map((e: any) => {
			const ret = e.get();
			return {
				problem_id: ret.problem_id,
				title: ret.title,
				source: ret.source,
				label: ret.label,
				in_date: ret.in_date,
				accepted: ret.accepted,
				submit: ret.submit,
				solved: ret.solved
			};
		});
		res.json(ok.okMaker(problemInfo));
	}
	catch (e) {
		console.log(e);
		res.json(error.internalError);
	}
});


module.exports = ["/problem_info", privilegeMiddleware, router];
