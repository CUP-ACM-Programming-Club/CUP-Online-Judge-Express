import express from "express";
const router = express.Router();
const [error] = require("../../module/const_var");
import { canBrowseSource } from "../../policy/predicates";
import { requireAny } from "../../policy/middleware";


router.get("/", requireAny(canBrowseSource));

import SubmissionService from "../../service/SubmissionService";

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
