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
import {storeSubmission} from "../../../application/judging/recorder";
import BanUserManager from "../../../infrastructure/persistence/contest/BanUserManager";
import log4j from "../../../main/init/log4j";

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
        if (parseInt(solutionPack.state) >= 32) {
            log4j.log(`got state error: ${solutionPack}`)
            if (finished) {
                this.clearBinding(solutionId);
            }
            return;
        }
        Object.assign(solutionPack, SubmitUserInfo.get(solutionId), ProblemFromContest.get(solutionId), ProblemFromSpecialSubject.get(solutionId), SolutionContext.get(solutionId));
        if (finished) {
            await BanUserManager.banUser(solutionPack);
            await storeSubmission(solutionPack);
        }

        if (SubmissionSet.has(solutionId)) {
            SubmissionSet.get(solutionId)!.emit("result", solutionPack);
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
