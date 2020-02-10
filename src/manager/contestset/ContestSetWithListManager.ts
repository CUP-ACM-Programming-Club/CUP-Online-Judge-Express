import {ErrorHandlerFactory} from "../../decorator/ErrorHandler";
import {ok} from "../../module/constants/state";
import {Request} from "express";
import ContestSetManager from "./ContestSetManager";
import ContestSetListManager from "./ContestSetListManager";

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
    }
}

export default new ContestSetWithListManager();
