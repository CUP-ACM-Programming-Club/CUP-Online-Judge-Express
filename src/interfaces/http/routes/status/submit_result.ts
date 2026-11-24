import express from "express";
const router = express.Router();
const [error] = require("../../../../domain/constants/const_var");

import SubmissionService from "../../../../application/services/SubmissionService";

router.get("/", async (req: any, res: any) => {
	try {
		const data = await SubmissionService.getSubmissionResultStats();
		res.json({
			status: "OK",
			data
		});
	}
	catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

module.exports = router;
