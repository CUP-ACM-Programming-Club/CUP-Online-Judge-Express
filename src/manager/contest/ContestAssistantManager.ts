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
}

export default new ContestAssistantManager();
