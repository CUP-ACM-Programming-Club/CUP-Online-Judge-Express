const path = require("path");

class ProblemFileManager {
	constructor() {
	}

	getProblemPath(problem_id) {
		const ojHome = path.join(global.config.judger.oj_home, "data");
		return path.join(ojHome, problem_id.toString());
	}

	getFilePath(problemId, fileName) {
		return path.join(this.getProblemPath(problemId), fileName);
	}
}

module.exports = new ProblemFileManager();
