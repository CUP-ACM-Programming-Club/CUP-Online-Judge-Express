import express from "express";
const router = express.Router();
const [error, ok] = require("../../../../domain/constants/const_var");
import SubmissionService from "../../../../application/services/SubmissionService";
const getSim = require("../../../../application/status/sim");

router.get("/", async (req: any, res: any) => {
	const cid = parseInt(req.query.cid);
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
