import { isAdmin, isContestAssistant, isContestMakerStrict, isContestManager } from "../../policy/predicates";

import express from "express";
const router = express.Router();
const { error, ok } = require("../../module/constants/state");
const ContestService = require("../../service/ContestService").default;
const ProblemInfoManager = require("../../module/problem/ProblemInfoManager");

async function privilegeMiddleware(req: any, res: any, next: any) {
	// 注意：本中间件挂在挂载层（见文件末尾导出），此时 req.params.contestId 尚未解析，contestId 为 NaN，
	// 后两项（出题人 / 助教）实际恒为假——现状如此，矩阵测试已锁定，见 docs/permission-matrix.md
	const contestId = parseInt(req.params.contestId);
	if (isAdmin(req) || isContestManager(req) || isContestMakerStrict(req, contestId) || await isContestAssistant(contestId, req.session.user_id)) {
		next();
	}
	else {
		res.json(error.noprivilege);
	}
}

router.get("/:contestId", async (req: any, res: any) => {
	try {
		const contestId = parseInt(req.params.contestId);
		// Using Service to get list (uncached for now per request logic but service caches list)
		// Original code: await getProblemInfo(contestId, false) -> false means LOCAL? vjudge argument.
		// Wait, module/contest/problem exports function(cid, vjudge).
		// Here second arg is false.
		// ContestService.getContestProblemList detects vjudge from contest info.
		// It fetches contest info first.
		// So ContestService is better.
		const result = await ContestService.getContestProblemList(req, contestId);
		const contestProblemInfo = result.data;
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
