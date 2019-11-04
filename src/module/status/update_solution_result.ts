import {Request, Response} from "express";
const {error, ok} = require("../constants/state");
const query = require("../../module/mysql_query");

export async function rejudgeHandler(idName: string, id: number | string, result: number | string) {
	return await query(`update solution set result = ? where ${idName} = ?`, [result, id]);
}

export function rejudgeFactory(idName: string) {
	return async function (id: number | string, result: number | string) {
		return await rejudgeHandler(idName, id, result);
	};
}

export const rejudgeByContest = rejudgeFactory("contest_id");
export const rejudgeBySolution = rejudgeFactory("solution_id");
export const rejudgeByProblem = rejudgeFactory("problem_id");
export async function router(req: Request, res: Response, result: number | string) {
	if(isNaN(<number>result)) {
		res.json(error.invalidParams);
		return;
	}
	try {
		const solution_id = req.body.solution_id;
		if (typeof solution_id === "undefined" || isNaN(solution_id)) {
			res.json(error.solutionIdNotValid);
		}
		else {
			await rejudgeBySolution(solution_id, 1);
			res.json(ok.ok);
		}
	}
	catch (e) {
		console.log(e);
		res.json(error.database);
	}
}
