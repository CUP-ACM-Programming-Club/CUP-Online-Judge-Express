import express from "express";
const router = express.Router();
const [error] = require("../../../../domain/constants/const_var");
import { canBrowseSource } from "../../../../domain/policy/predicates";
import { requireAny } from "../../middleware/policy";


router.get("/", requireAny(canBrowseSource));

import SubmissionService from "../../../../application/services/SubmissionService";

router.get("/", async (req: any, res: any) => {
	try {
		const solution_id = parseInt(req.query.sid) || "";
		const browse_privilege = canBrowseSource(req);
		if (!solution_id || isNaN(solution_id as number)) {
			res.json(error.invalidParams);
		} else if (!browse_privilege) {
			res.json(error.noprivilege);
		} else {
			const data = await SubmissionService.getRuntimeInfo(solution_id);
			res.json({
				status: "OK",
				data
			});
		}
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

module.exports = router;
