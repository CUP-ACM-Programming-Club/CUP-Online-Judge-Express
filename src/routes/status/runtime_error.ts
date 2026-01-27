import express from "express";
const router = express.Router();
const [error] = require("../../module/const_var");


router.get("/", (req: any, res: any, next: any) => {
	const browse_privilege = req.session.isadmin || req.session.source_browser;
	if (!browse_privilege) {
		res.json(error.noprivilege);
	} else {
		next();
	}
});

import SubmissionService from "../../service/SubmissionService";

router.get("/", async (req: any, res: any) => {
	try {
		const solution_id = parseInt(req.query.sid) || "";
		const browse_privilege = req.session.isadmin || req.session.source_browser;
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
