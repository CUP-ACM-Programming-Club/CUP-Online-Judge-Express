import { ContestProblemInfoLookup } from "../../../application/ports/ContestProblemInfoLookup";
import ProblemInfoManager = require("../problem/ProblemInfoManager");

/** contest 领域读取题目信息的适配器：转调 problem 领域的 ProblemInfoManager。 */
export class ContestProblemInfoLookupAdapter implements ContestProblemInfoLookup {
	findProblemInfo(problemId: any) {
		return ProblemInfoManager
			.newInstance()
			.setProblemId(problemId)
			.find();
	}
}

export default new ContestProblemInfoLookupAdapter();
