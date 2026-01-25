import express from "express";
import AdminProblemService from "../../../service/admin/AdminProblemService";
const [error, ok] = require("../../../module/const_var");

const router = express.Router();

async function rejudgeHandler(res: any, id: any, func: Function) {
	try {
		await func(id); // Service methods now only take ID
		res.json(ok.ok);
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
}

router.post("/contest", async (req: any, res: any) => {
	await rejudgeHandler(res, req.body.contest_id, AdminProblemService.rejudgeContest);
});

router.post("/solution", async (req: any, res: any) => {
	await rejudgeHandler(res, req.body.solution_id, AdminProblemService.rejudgeSolution);
});

router.post("/problem", async (req: any, res: any) => {
	await rejudgeHandler(res, req.body.problem_id, AdminProblemService.rejudgeProblem);
});


export = ["/rejudge", router];
