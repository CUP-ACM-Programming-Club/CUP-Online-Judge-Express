import {ErrorHandlerFactory} from "../../decorator/ErrorHandler";
import {ok} from "../../module/constants/state";
import {Request} from "express";
import ContestSetManager from "./ContestSetManager";
import ContestSetListManager from "./ContestSetListManager";
import ContestAssistantManager from "../contest/ContestAssistantManager";
import ContestManager from "../contest/ContestManager";

class ContestSetWithListManager {
    @ErrorHandlerFactory(ok.okMaker)
    async addContestSet(req: Request) {
        req.body.contestSetId = await ContestSetManager.addContestSetByRequest(req);
        await ContestSetListManager.updateContestSetListByRequest(req);
    }

    @ErrorHandlerFactory(ok.okMaker)
    async updateContestSet(req: Request) {
        await ContestSetManager.updateContestSetByRequest(req);
        await ContestSetListManager.updateContestSetListByRequest(req);
        await ContestAssistantManager.updateTopicAssistantListByRequest(req);
        if (req.body.userList === undefined || req.body.userList === null) {
            return;
        }
        const contestIdList = await ContestSetListManager.getContestListByContestSetIdByRequest(req);
        await ContestManager.updateContestCompetitor(contestIdList || [], req.body.userList || [], req.body.contestList || []);
    }
}

export default new ContestSetWithListManager();
