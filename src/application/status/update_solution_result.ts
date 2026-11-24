import { submissionJudger } from "../ports/SubmissionJudger";
import { judgeQueueRepository } from "../ports/JudgeQueueRepository";
import ScoreboardService from "../services/ScoreboardService";
const { error, ok } = require("../../domain/constants/state");

async function resetSolutionStatus(idName: string, id: number | string) {
	// Reset result to 1 (Pending/Rejudging) and clear performance metrics
	await judgeQueueRepository.resetSolutionStatus(idName, id);
}

export async function rejudgeHandler(idName: string, id: number | string, result: number | string) {
	// Legacy support wrapper, but we enforce result=1 for rejudge usually
	await judgeQueueRepository.setSolutionResult(idName, id, result);
}

export async function rejudgeSolution(solutionId: number) {
	try {
		await resetSolutionStatus("solution_id", solutionId);

		// Trigger Judger Immediately
		const solution = await judgeQueueRepository.findSolutionOwner(solutionId);
		if (solution && solution.length > 0) {
			const { user_id } = solution[0];
			const priv = await judgeQueueRepository.countAdministratorForRejudge(user_id);
			const isAdmin = !!(priv && priv.length && priv[0].cnt);
			await submissionJudger.addTask(solutionId, isAdmin);
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

