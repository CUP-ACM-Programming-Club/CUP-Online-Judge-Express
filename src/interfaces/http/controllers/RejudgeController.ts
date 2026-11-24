import { Request, Response } from "express";
import { rejudgeSolution } from "../../../application/status/update_solution_result";
const { error, ok } = require("../../../domain/constants/state");

/** POST 重判 / 判为作弊：从请求体取 solution_id，交给用例。返回结构与重构前一致。 */
export async function rejudgeRequestHandler(req: Request, res: Response, result: number | string) {
	if (isNaN(<number>result)) {
		res.json(error.invalidParams);
		return;
	}
	try {
		const solution_id = req.body.solution_id;
		if (typeof solution_id === "undefined" || isNaN(solution_id)) {
			res.json(error.solutionIdNotValid);
		} else {
			await rejudgeSolution(solution_id);
			res.json(ok.ok);
		}
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
}
