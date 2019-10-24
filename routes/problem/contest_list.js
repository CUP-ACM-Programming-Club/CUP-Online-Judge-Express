const express = require("express");
const router = express.Router();
const ContestInfoManager = require("../../module/contest/ContestInfoManager");
const ContestFinder = require("../../module/problem/ContestFinder");
const ErrorCollector = require("../../module/error/collector");
const {error, ok} = require("../../module/constants/state");
const adminMiddleware = require("../../middleware/admin");

router.get("/:problemId", async (req, res) => {
	try {
		const contestList = await ContestFinder.newInstance().setProblemId(parseInt(req.params.problemId)).find();
		const contestInfoList = await Promise.all(contestList.map(el => ContestInfoManager.newInstance().setContestId(el.contest_id).find()));
		res.json(ok.okMaker(contestInfoList.map(e => e.get())));
	}
	catch (e) {
		console.log(__filename, e);
		ErrorCollector.push(__filename, e);
		res.json(error.internalError);
	}
});

module.exports = ["/contest_list", adminMiddleware, router];
