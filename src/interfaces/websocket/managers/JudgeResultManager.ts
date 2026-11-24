import ProblemFromContest from "../set/ProblemFromContest";
import ProblemFromSpecialSubject from "../set/ProblemFromSpecialSubject";
import SubmissionOriginSet from "../set/SubmissionOriginSet";
import SubmitUserInfo from "../set/SubmitUserInfo";
import SubmissionSet from "../set/SubmissionSet";
import SolutionContext from "../set/SolutionContext";
import {IKey} from "../set/BaseUserSet";
import BroadcastManager from "./BroadcastManager";
import StatusSet from "../singleton/StatusSet";
import ContestPagePushSet from "../set/ContestPagePushSet";
import {JudgeResultNotifier} from "../../../application/ports/JudgeResultNotifier";

/**
 * 判题结果推送，实现 application 的 JudgeResultNotifier 端口。
 * 判题结果的处理流程（封禁、回写）在 application/judging/JudgeEventUseCases。
 */
export class JudgeResultManager implements JudgeResultNotifier {
    setCollector = [ProblemFromContest
        , ProblemFromSpecialSubject
        , SubmissionOriginSet
        , SubmitUserInfo
        , SubmissionSet
        , SolutionContext];

    clearBinding(key: IKey) {
        this.setCollector.forEach(e => e.remove(key));
    }

    attachSubmissionContext(solutionId: number, solutionPack: any) {
        Object.assign(solutionPack, SubmitUserInfo.get(solutionId), ProblemFromContest.get(solutionId), ProblemFromSpecialSubject.get(solutionId), SolutionContext.get(solutionId));
    }

    pushResult(solutionId: number, solutionPack: any) {
        if (SubmissionSet.has(solutionId)) {
            SubmissionSet.get(solutionId)!.emit("result", solutionPack);
            BroadcastManager.sendMessage(StatusSet.getList(), "result", solutionPack, 1, !!ProblemFromContest.get(solutionId));
            if (SubmissionOriginSet.has(solutionId)) {
                BroadcastManager.sendMessage(ContestPagePushSet.get(SubmissionOriginSet.get(solutionId)), "result", solutionPack, 1);
            }
        }
    }

    notifyRemoteJudge(solutionId: number | string) {
        const userSocket = SubmissionSet.get(solutionId);
        if (userSocket) {
            userSocket.emit("remoteJudge", {
                solutionId
            });
        }
    }
}

export default new JudgeResultManager();
