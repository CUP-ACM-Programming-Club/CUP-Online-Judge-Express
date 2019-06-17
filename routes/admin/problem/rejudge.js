const express = require("express");
const router = express.Router();
const [error, ok] = require("../../../module/const_var");
const {rejudgeBySolution, rejudgeByContest, rejudgeByProblem} = require("../../../module/status/update_solution_result");

async function rejudgeHandler(res, id, func) {
	try {
		await func(id, 1);
		res.json(ok.ok);
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
}

router.post("/contest", async (req, res) => {
	await rejudgeHandler(res, req.body.contest_id, rejudgeByContest);
});

router.post("/solution", async (req, res) => {
	await rejudgeHandler(res, req.body.solution_id, rejudgeBySolution);
});

router.post("/problem", async (req, res) => {
	await rejudgeHandler(res, res.body.problem_id, rejudgeByProblem);
});


module.exports = ["/rejudge", router];