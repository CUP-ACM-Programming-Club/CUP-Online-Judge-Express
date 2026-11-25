import express from "express";
const router = express.Router();
const [error, ok] = require("../../../../domain/constants/const_var");
import SubmissionService from "../../../../application/services/SubmissionService";
const getSim = require("../../../../application/status/sim");
import { canBrowseSource, canManageContest, isContestMaker } from "../../../../domain/policy/predicates";

// 查重相似对：全站只给 admin | source_browser；按比赛查再加该比赛的管理者（contest_manager、出题人、助教）。
// 修复：之前任何登录用户都能取任意比赛的查重结果。
async function canViewSim(req: any, cid?: number) {
	if (canBrowseSource(req)) {
		return true;
	}
	if (cid === undefined || isNaN(cid)) {
		return false;
	}
	return isContestMaker(req, cid) || await canManageContest(req, cid);
}

router.get("/", async (req: any, res: any) => {
	const cid = parseInt(req.query.cid);
	if (!await canViewSim(req, isNaN(cid) ? undefined : cid)) {
		res.json(error.noprivilege);
		return;
	}
	try {
		const data = await SubmissionService.getSimRelatedSolution(isNaN(cid) ? undefined : cid);
		res.json(ok.okMaker(data));
	}
	catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

router.get("/:cid", async (req: any, res: any) => {
	if (!await canViewSim(req, parseInt(req.params.cid))) {
		res.json(error.noprivilege);
		return;
	}
	try {
		let data = await getSim(req.params.cid);
		res.json(ok.okMaker(data));
	}
	catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

module.exports = router;
