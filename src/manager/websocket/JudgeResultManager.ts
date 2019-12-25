import ProblemFromContest from "../../module/websocket/set/ProblemFromContest";
import ProblemFromSpecialSubject from "../../module/websocket/set/ProblemFromSpecialSubject";
import SubmissionOriginSet from "../../module/websocket/set/SubmissionOriginSet";
import SubmitUserInfo from "../../module/websocket/set/SubmitUserInfo";
import SubmissionSet from "../../module/websocket/set/SubmissionSet";
import SolutionContext from "../../module/websocket/set/SolutionContext";
import {IKey} from "../../module/websocket/set/BaseUserSet";
import BroadcastManager from "./BroadcastManager";
import StatusSet from "../../module/websocket/singleton/StatusSet";
import ContestPagePushSet from "../../module/websocket/set/ContestPagePushSet";
import {storeSubmission} from "../../module/judger/recorder";
import BanUserManager from "../contest/BanUserManager";

export class JudgeResultManager {
    setCollector = [ProblemFromContest
        , ProblemFromSpecialSubject
        , SubmissionOriginSet
        , SubmitUserInfo
        , SubmissionSet
        , SolutionContext];

    clearBinding(key: IKey) {
        this.setCollector.forEach(e => e.remove(key));
    }

    async messageHandle(message: any) {
        const solutionPack = message;
        const finished = parseInt(solutionPack.finish);
        const solutionId = parseInt(solutionPack.solution_id);
        Object.assign(solutionPack, SubmitUserInfo.get(solutionId), ProblemFromContest.get(solutionId), ProblemFromSpecialSubject.get(solutionId), SolutionContext.get(solutionId));
        if (finished) {
            await BanUserManager.banUser(solutionPack);
            await storeSubmission(solutionPack);
        }

        if (SubmissionSet.has(solutionId)) {
            SubmissionSet.get(solutionId).emit("result", solutionPack);
            BroadcastManager.sendMessage(StatusSet.getList(), "result", solutionPack, 1, !!ProblemFromContest.get(solutionId));
            if (SubmissionOriginSet.has(solutionId)) {
                BroadcastManager.sendMessage(ContestPagePushSet.get(SubmissionOriginSet.get(solutionId)), "result", solutionPack, 1);
            }
        }

        if (finished) {
            this.clearBinding(solutionId);
        }
    }
}

export default new JudgeResultManager();
