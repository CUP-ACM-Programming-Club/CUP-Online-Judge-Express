import express from "express";
const router = express.Router();
const [error] = require("../../module/const_var");

import SubmissionService from "../../service/SubmissionService";

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
