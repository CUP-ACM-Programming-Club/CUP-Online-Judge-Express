import { contestProblem as ContestProblem } from "../../orm/ts-model";

class ContestFinder {
	async find (problemId: number) {
		return ContestProblem.findAll({
			where: {
				problem_id: problemId
			}
		});
	}
}

export default new ContestFinder();
