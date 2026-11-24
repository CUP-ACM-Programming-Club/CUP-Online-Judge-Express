import { isAdmin, isContestAssistant, isContestMakerStrict, isContestManager } from "../../../../domain/policy/predicates";

import express from "express";
const router = express.Router();
const { error, ok } = require("../../../../domain/constants/state");
const ContestProblemInfoUseCases = require("../../../../application/contest/ContestProblemInfoUseCases").default;

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
		const problemInfo = await ContestProblemInfoUseCases.getProblemInfoList(req, contestId);
		res.json(ok.okMaker(problemInfo));
	}
	catch (e) {
		console.log(e);
		res.json(error.internalError);
	}
});


module.exports = ["/problem_info", privilegeMiddleware, router];
