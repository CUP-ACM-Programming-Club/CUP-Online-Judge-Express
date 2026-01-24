import express from "express";
const router = express.Router();
const [error] = require("../../../module/const_var");
const cache_query = require("../../../module/mysql_cache");
//const dayjs = require("dayjs");

function validateAttribute(targetObject: any, id: any) {
	if (isNaN(Number(targetObject[id]))) {
		return -1;
	} else {
		return parseInt(targetObject[id]);
	}
}

router.get("/", async (req: any, res: any) => {
	try {
		res.json({
			status: "OK",
			statement: "Route for /problem/:problem_id && /contest/:contest_id"
		});
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

async function CodeLengthHandler(req: any, res: any, statement = "1 = 1", sqlArr: any) {
	const data = await cache_query(`select in_date, code_length from solution where ${statement} and result = 4`,
		sqlArr);
	res.json({
		status: "OK",
		data
	});
}

async function problemCodeLengthHandler(req: any, res: any, problem_id: any) {
	await CodeLengthHandler(req, res, "problem_id = ?", [problem_id]);
}

async function contestCodeLengthHandler(req: any, res: any, contest_id: any) {
	await CodeLengthHandler(req, res, "contest_id = ?", [contest_id]);
}

router.get("/problem/:problem_id", async (req: any, res: any) => {
	try {
		let problem_id = validateAttribute(req.params, "problem_id");
		if (problem_id === -1) {
			return res.json(error.invalidParams);
		}
		await problemCodeLengthHandler(req, res, problem_id);
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

router.get("/contest/:contest_id", async (req: any, res: any) => {
	try {
		let contest_id = validateAttribute(req.params, "contest_id");
		if (contest_id === -1) {
			return res.json(error.invalidParams);
		}
		await contestCodeLengthHandler(req, res, contest_id);
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

module.exports = ["/code_length", router];
