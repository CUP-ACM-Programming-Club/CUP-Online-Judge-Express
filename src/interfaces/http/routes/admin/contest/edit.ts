import { canManageContest } from "../../../../../domain/policy/predicates";
import { error, ok } from "../../../../../domain/constants/state";
import AdminContestService from "../../../../../application/services/admin/AdminContestService";
import isNumber from "../../../../../shared/isNumber";

// admin | contest_manager（全局）| 该比赛助教；比赛 id：GET 取 params.id，其余取 body.contest_id
async function privilegeMiddleware(req: any, res: any, next: any) {
	const contestId = req.method.toLowerCase() === "get" ? req.params.id : req.body.contest_id;
	if (await canManageContest(req, contestId)) {
		return next();
	}
	else {
		res.json(error.noprivilege);
	}
}
const router = require("../../../admin/baseGetter")("contest", "contest_id", [privilegeMiddleware]);

router.post("/", privilegeMiddleware, async (req: any, res: any) => {
	try {
		await AdminContestService.updateContest(req.body.contest_id, req.body);
		res.json(ok.ok);
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

router.get("/user/:id", privilegeMiddleware, async (req: any, res: any) => {
	try {
		let contest_id = req.params.id;
		if (!isNumber(contest_id)) {
			res.json(error.invalidParams);
			return;
		}
		const data = await AdminContestService.getContestCompetitors(contest_id);
		res.json(ok.okMaker(data));
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

module.exports = ["/edit", router];
