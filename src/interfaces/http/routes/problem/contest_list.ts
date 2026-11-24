import express from "express";

import ContestInfoManager from "../../../../application/contest/ContestInfoManager";
import ContestFinder from "../../../../application/problem/ContestFinder";
const router = express.Router();
const ErrorCollector = require("../../../../shared/ErrorCollector");
const {error, ok} = require("../../../../domain/constants/state");
const adminMiddleware = require("../../middleware/admin");

router.get("/:problemId", async (req, res) => {
	try {
		const contestList = await ContestFinder.find(parseInt(req.params.problemId));
		const contestInfoList = await Promise.all(contestList.map(el => ContestInfoManager.find(el.contestId!)));
		res.json(ok.okMaker(contestInfoList.filter(e => e && e.get && typeof e.get === "function").map(e => e!.get())));
	}
	catch (e) {
		console.log(__filename, e);
		ErrorCollector.push(__filename, e);
		res.json(error.internalError);
	}
});

module.exports = ["/contest_list", adminMiddleware, router];
