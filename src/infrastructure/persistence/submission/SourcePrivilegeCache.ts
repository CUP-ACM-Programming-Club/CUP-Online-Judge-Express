import Cacheable from "../../../shared/cache/Cacheable";
import {Request} from "express";
import SubmissionManager from "./SubmissionManager";
import { canBrowseSource, isContestAssistant } from "../../../domain/policy/predicates";
import CachePool from "../../../shared/cache/CachePool";

class SourcePrivilegeCache {
    @Cacheable(new CachePool(), 10, "second")
    async checkPrivilege (session: Express.Session, solutionId: number)  {
        // admin | source_browser | 该提交所属比赛的助教
        if (canBrowseSource({ session })) {
            return true;
        }
        const contestId = (await SubmissionManager.getSolutionInfo(solutionId))!.contest_id;
        if (!contestId) {
            return false;
        }
        return await isContestAssistant(contestId, session!.user_id);
    }
}

export default new SourcePrivilegeCache();
