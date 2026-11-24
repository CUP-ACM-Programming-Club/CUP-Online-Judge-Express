import { JudgerEventListener, RejectJudgeInfo } from "../ports/SubmissionJudger";
import { judgeResultNotifier, judgeStateLog } from "../ports/JudgeResultNotifier";
import { submissionBanUser } from "../ports/SubmissionBanUser";
import UnjudgedSubmissionCollector from "./UnjudgedSubmissionCollector";
import { storeSubmission } from "./recorder";

/**
 * 判题机事件处理（原 interfaces/websocket/managers/JudgeResultManager.messageHandle 与 localJudger 的 reject_judge 处理）：
 * 判题结束则封禁作弊者并回写判题结果，推送交给 JudgeResultNotifier。
 */
export class JudgeEventUseCases implements JudgerEventListener {
	async onJudgeResult(message: any) {
		const solutionPack = message;
		const finished = parseInt(solutionPack.finish);
		const solutionId = parseInt(solutionPack.solution_id);
		if (parseInt(solutionPack.state) >= 32) {
			judgeStateLog.log(`got state error: ${solutionPack}`);
			if (finished) {
				judgeResultNotifier.clearBinding(solutionId);
			}
			return;
		}
		judgeResultNotifier.attachSubmissionContext(solutionId, solutionPack);
		if (finished) {
			await submissionBanUser.banUser(solutionPack);
			await storeSubmission(solutionPack);
		}

		judgeResultNotifier.pushResult(solutionId, solutionPack);

		if (finished) {
			judgeResultNotifier.clearBinding(solutionId);
		}
	}

	onRejectJudge(payload: RejectJudgeInfo) {
		UnjudgedSubmissionCollector.addNewNoDataProblemId(payload.problemId);
		judgeResultNotifier.notifyRemoteJudge(payload.solutionId);
	}
}

export default new JudgeEventUseCases();
