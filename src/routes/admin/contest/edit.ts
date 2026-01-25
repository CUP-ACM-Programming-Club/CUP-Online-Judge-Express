import ContestAssistantManager from "../../../manager/contest/ContestAssistantManager";
import { error, ok } from "../../../module/constants/state";
import AdminContestService from "../../../service/admin/AdminContestService";
import isNumber from "../../../module/util/isNumber";
const query = require("../../../module/mysql_query");

async function privilegeMiddleware(req: any, res: any, next: any) {
	if (req.session.isadmin || req.session.contest_manager) {
		return next();
	}
	const method = req.method;
	const contestId = method.toLowerCase() === "get" ? req.params.id : req.body.contest_id;
	const result = await ContestAssistantManager.userIsContestAssistant(contestId, req.session.user_id);
	if (result) {
		return next();
	}
	else {
		res.json(error.noprivilege);
	}
}
const router = require("../../../module/admin/baseGetter")("contest", "contest_id", [privilegeMiddleware]);

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
		const data = await query("select user_id from privilege where rightstr = ?", [`c${contest_id}`]);
		res.json(ok.okMaker(data));
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

module.exports = ["/edit", router];
