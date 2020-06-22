import Cacheable from "../../decorator/Cacheable";
import {Request} from "express";
import SubmissionManager from "./SubmissionManager";
import ContestAssistantManager from "../contest/ContestAssistantManager";
import CachePool from "../../module/common/CachePool";

class SourcePrivilegeCache {
    @Cacheable(new CachePool(), 10, "second")
    async checkPrivilege (req: Request, id: number)  {
        const basePrivilege = req.session!.isadmin || req.session!.source_browser;
        if (basePrivilege) {
            return basePrivilege;
        }
        const contestId = (await SubmissionManager.getSolutionInfo(id)).contest_id;
        if (!contestId) {
            return false;
        }
        return await ContestAssistantManager.userIsContestAssistant(contestId, req.session!.user_id);
    }
}

export default new SourcePrivilegeCache();
