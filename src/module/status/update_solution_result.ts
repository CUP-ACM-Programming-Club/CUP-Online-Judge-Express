import { Request, Response } from "express";
import localJudger from "../judger";
import client from "../redis";
import ScoreboardService from "../../service/ScoreboardService";
const { error, ok } = require("../constants/state");
const query = require("../mysql_query");

async function resetSolutionStatus(idName: string, id: number | string) {
	// Reset result to 1 (Pending/Rejudging) and clear performance metrics
	await query(`UPDATE solution 
                 SET result = 1, 
                     time = 0, 
                     memory = 0, 
                     pass_rate = 0, 
                     pass_point = 0, 
                     judger = 'Waiting' 
                 WHERE ${idName} = ?`, [id]);
}

export async function rejudgeHandler(idName: string, id: number | string, result: number | string) {
	// Legacy support wrapper, but we enforce result=1 for rejudge usually
	await query(`UPDATE solution SET result = ? WHERE ${idName} = ?`, [result, id]);
}

export async function rejudgeSolution(solutionId: number) {
	try {
		await resetSolutionStatus("solution_id", solutionId);

		// Trigger Judger Immediately
		const solution = await query("SELECT user_id, contest_id FROM solution WHERE solution_id = ?", [solutionId]);
		if (solution && solution.length > 0) {
			const { user_id } = solution[0];
			const priv = await query("SELECT count(1) as cnt FROM privilege WHERE user_id = ? AND rightstr = 'administrator'", [user_id]);
			const isAdmin = !!(priv && priv.length && priv[0].cnt);
			await localJudger.addTask(solutionId, isAdmin);
		}
		return { status: "OK" };
	} catch (e) {
		console.error("rejudgeSolution error:", e);
		throw e;
	}
}

export async function rejudgeContest(contestId: number) {
	try {
		await resetSolutionStatus("contest_id", contestId);
		await ScoreboardService.clearScoreboardCache(contestId);
		return { status: "OK" };
	} catch (e) {
		console.error("rejudgeContest error:", e);
		throw e;
	}
}

export async function rejudgeProblem(problemId: number) {
	try {
		await resetSolutionStatus("problem_id", problemId);
		// Note: Rejudging a problem might affect many contests, harder to clear specific scoreboard caches
		// We rely on collector for mass rejudge usually, but we could trigger first few
		return { status: "OK" };
	} catch (e) {
		console.error("rejudgeProblem error:", e);
		throw e;
	}
}

export const rejudgeByContest = async (contestId: number | string, result: number | string) => {
	return rejudgeContest(Number(contestId));
};

export const rejudgeBySolution = async (solutionId: number | string, result: number | string) => {
	return rejudgeSolution(Number(solutionId));
};

export const rejudgeByProblem = async (problemId: number | string, result: number | string) => {
	return rejudgeProblem(Number(problemId));
};

export async function router(req: Request, res: Response, result: number | string) {
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
