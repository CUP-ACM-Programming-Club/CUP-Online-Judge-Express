import express from "express";
const router = express.Router();
import auth from "../middleware/auth";
const { error, ok } = require("../../../domain/constants/state");
import ProblemDataUseCases from "../../../application/problem/ProblemDataUseCases";

router.get("/:problem_id", async (req, res) => {
	try {
		const problem_id = parseInt(req.params.problem_id);
		if (isNaN(problem_id)) {
			res.json(error.invalidProblemID);
			return;
		}
		const validFile = await ProblemDataUseCases.listJudgeFiles(problem_id);
		res.json(ok.okMaker(validFile));
	} catch (e) {
		console.log(e);
		res.json(error.errorMaker(e));
	}
});

module.exports = ["/file", auth, router];
