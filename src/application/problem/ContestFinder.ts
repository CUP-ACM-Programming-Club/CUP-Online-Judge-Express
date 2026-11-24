import { contestRepository } from "../ports/ContestRepository";

class ContestFinder {
	/** 返回包含该题目的 contest_problem 行（ORM 模型实例） */
	async find (problemId: number): Promise<any[]> {
		return contestRepository.findContestProblemModelsByProblemId(problemId);
	}
}

export default new ContestFinder();
