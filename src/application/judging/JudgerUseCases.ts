import { submissionJudger } from "../ports/SubmissionJudger";

/** 判题机状态查询（在线用户广播里带上空闲判题机列表）。 */
export class JudgerUseCases {
	getStatus() {
		return submissionJudger.getStatus();
	}
}

export default new JudgerUseCases();
