import ScoreboardService from "../service/ScoreboardService";
import ContestService from "../service/ContestService";
import HttpError from "../module/util/HttpError";
import ContestAssistantManager from "../manager/contest/ContestAssistantManager";
const { error, ok } = require("../module/constants/state");
import express from "express";
const router = express.Router();
import auth from "../middleware/auth";

router.get("/:cid", (req: any, res: any, next: any) => {
	const cid = isNaN(Number(req.params.cid)) ? -1 : parseInt(req.params.cid);
	if (cid === -1) {
		res.json(error.errorMaker("contest_id is not a number"));
	} else if (cid < 1000) {
		res.json(error.errorMaker("contest_id invalid"));
	} else {
		next();
	}
});

router.get("/:cid", async (req: any, res: any) => {
	const cid = parseInt(req.params.cid);
	try {
		await ContestService.checkContestAccess(req, cid);
		const browserPrivilege = req.session.isadmin || req.session.contest_manager || await ContestAssistantManager.userIsContestAssistant(cid, req.session.user_id);
		const data = await ScoreboardService.getScoreboard(cid, browserPrivilege);
		res.json(data);
	} catch (e: any) {
		if (e instanceof HttpError) {
			res.status(e.statusCode).json({
				status: e.status,
				statement: e.statement
			});
		} else if (e.message === "no such contest") {
			res.json(error.errorMaker("no such contest"));
		} else {
			console.log(e);
			res.json(error.internalError);
		}
	}
});

router.get("/:cid/line", async (req: any, res: any) => {
	const cid = parseInt(req.params.cid);
	try {
		await ContestService.checkContestAccess(req, cid);
	} catch (e: any) {
		if (e instanceof HttpError) {
			res.status(e.statusCode).json({
				status: e.status,
				statement: e.statement
			});
			return;
		} else {
			res.json(error.internalError);
			return;
		}
	}
	// We reuse submitHandlerOptimized but we need to match original logic.
	// Original logic: submitHandler(cid) is called.
	const browserPrivilege = req.session.isadmin || req.session.contest_manager || await ContestAssistantManager.userIsContestAssistant(cid, req.session.user_id);

	// Note: getScoreboard gets *everything* including users, but line route needs raw submit stat? 
	// Actually original code reused submitHandler(cid) which is exactly what submitHandlerOptimized does (well, optimized).
	// But getScoreboard returns a composite object.
	// We should expose getScoreboard's internal components if needed, or just use getScoreboard for data.
	// Wait, getLineBreakInfo is specific.

	// Let's use getScoreboard to get `data` (which is submit stat) and `users`. 
	// But getScoreboard computes ALLSS.

	// Let's check logic:
	// let [submitStat, line_break, contest_user] = await Promise.all([submitHandler(cid), lineBreakHandler(cid), contestUserHandler(cid)]);

	// So we need individual methods exposed?
	// I exposed getLineBreakInfo.

	// I need access to submitHandlerOptimized results.
	// ScoreboardService.getScoreboard calls it.

	// Maybe I should add a specific method for line route?
	// Or just use getScoreboard and extract?
	// getScoreboard returns { data: ... }. `data` IS the result of submitHandlerOptimized.

	try {
		const scoreboardData = await ScoreboardService.getScoreboard(cid, browserPrivilege);
		const lineBreak = await ScoreboardService.getLineBreakInfo(cid);
		// And contest user?
		// getScoreboard returns `users` which is result[3] -> contestUserHandler.

		let map: any = {};
		for (const i of scoreboardData.data) {
			map[i.solution_id] = i;
		}
		for (const i of lineBreak) {
			map[i.solution_id] = Object.assign(map[i.solution_id], i);
		}
		res.json(ok.okMaker({
			map: map,
			user: scoreboardData.users
		}));
	} catch (e) {
		console.log(e);
		res.json(error.internalError);
	}
});


const routes: any = ["/scoreboard", auth, router];

// 导出缓存清除函数供其他模块使用（例如提交后清除相关比赛缓存）
routes.clearScoreboardCache = ScoreboardService.clearScoreboardCache.bind(ScoreboardService);

module.exports = routes;

