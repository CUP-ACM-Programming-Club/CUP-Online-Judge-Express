import {MySQLManager} from "../mysql/MySQLManager";
import {ErrorHandlerFactory} from "../../decorator/ErrorHandler";
import {Request} from "express";
import {ok} from "../../module/constants/state";
import Cacheable from "../../decorator/Cacheable";
import CachePool from "../../module/common/CachePool";

const cache_query = require("../../module/mysql_cache");

class ContestAssistantManager {
    async getContestAssistants (contestId: number | string) {
        return await cache_query("select user_id from contest_assistant where contest_id = ?", [contestId]);
    }

    @ErrorHandlerFactory(ok.okMaker)
    async getContestAssistantsByRequest (req: Request) {
        const contestId = req.params.contestId;
        return await this.getContestAssistants(contestId);
    }

    async getAllContestAssistants () {
        return await cache_query("select user_id, contest_id from contest_assistant");
    }

    @ErrorHandlerFactory(ok.okMaker)
    async getAllContestAssistantsByRequest(req: Request) {
        return await this.getAllContestAssistants();
    }

    @Cacheable(new CachePool<any>(), 1, "hour")
    async userIsContestAssistant (contestId: number | string, userId: string) {
        const userList: any[] = await this.getContestAssistants(contestId);
        return userList.map(e => e.user_id).includes(userId);
    }

    @ErrorHandlerFactory(ok.okMaker)
    async userIsContestAssistantByRequest(req: Request) {
        return await this.userIsContestAssistant(req.params.contest_id, req.session!.user_id);
    }

    async setContestAssistant (contestId: number | string, userId: string) {
        return await MySQLManager.execQuery("insert into contest_assistant(contest_id, user_id) values(?,?)",[contestId, userId]);
    }

    async removeContestAssistant (contestId: number | string, userId: string) {
        return await MySQLManager.execQuery("delete from contest_assistant where contest_id = ? and user_id = ?", [contestId, userId]);
    }

    @ErrorHandlerFactory(ok.okMaker)
    async setContestAssistantByRequest (req: Request) {
        const contestId = req.body.contestId;
        const userId = req.body.userId;
        await this.setContestAssistant(contestId, userId);
        return {contestId, userId};
    }

    @ErrorHandlerFactory(ok.okMaker)
    async removeContestAssistantByRequest (req: Request) {
        const contestId = req.body.contestId;
        const userId = req.body.userId;
        await this.removeContestAssistant(contestId, userId);
        return {contestId, userId};
    }
}

export default new ContestAssistantManager();
