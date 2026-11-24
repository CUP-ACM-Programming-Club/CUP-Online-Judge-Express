import express from "express";
const router = express.Router();
import auth from "../middleware/auth";
const [error] = require("../../../domain/constants/const_var");
import ProblemImageUseCases from "../../../application/problem/ProblemImageUseCases";

function validateProblemId(req: any) {
	const problem_id = req.params.problem_id;
	if (!isNaN(problem_id)) {
		return parseInt(problem_id);
	} else {
		return false;
	}
}

async function photoHandler(req: any, res: any, key: any) {
	let problem_id: any;
	if ((problem_id = validateProblemId(req)) === false) {
		res.json(error.invalidProblemID);
		return;
	}
	res.json({
		status: "OK",
		data: await ProblemImageUseCases.listImages(problem_id, key)
	});
}

router.get("/description/:problem_id", async (req: any, res: any) => {
	await photoHandler(req, res, "description");
});

router.get("/input/:problem_id", async (req: any, res: any) => {
	await photoHandler(req, res, "input");
});

router.get("/output/:problem_id", async (req: any, res: any) => {
	await photoHandler(req, res, "output");
});

router.get("/hint/:problem_id", async (req: any, res: any) => {
	await photoHandler(req, res, "hint");
});

module.exports = ["/photo", auth, router];
