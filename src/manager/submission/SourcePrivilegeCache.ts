import Cacheable from "../../decorator/Cacheable";
import {Request} from "express";
import SubmissionManager from "./SubmissionManager";
import ContestAssistantManager from "../contest/ContestAssistantManager";
import CachePool from "../../module/common/CachePool";

class SourcePrivilegeCache {
    @Cacheable(new CachePool(), 10, "second")
    async checkPrivilege (session: Express.Session, solutionId: number)  {
        const basePrivilege = session!.isadmin || session!.source_browser;
        if (basePrivilege) {
            return basePrivilege;
        }
        const contestId = (await SubmissionManager.getSolutionInfo(solutionId)).contest_id;
        if (!contestId) {
            return false;
        }
        return await ContestAssistantManager.userIsContestAssistant(contestId, session!.user_id);
    }
}

export default new SourcePrivilegeCache();
