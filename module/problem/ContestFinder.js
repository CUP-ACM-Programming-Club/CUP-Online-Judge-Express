const sequelize = require("../../orm/instance/sequelize");
const ContestProblem = sequelize.import("contest_problem", require("../../orm/models/contest_problem"));

class ContestFinder {
	constructor() {}

	static newInstance() {
		return new ContestFinder();
	}

	setProblemId (problemId) {
		this.problemId = problemId;
		return this;
	}

	async find () {
		return ContestProblem.findAll({
			where: {
				problem_id: this.problemId
			}
		});
	}
}


module.exports = ContestFinder;
