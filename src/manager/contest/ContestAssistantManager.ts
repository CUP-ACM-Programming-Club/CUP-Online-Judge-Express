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

    async getTopicAssistant (contestId: number | string) {
        return await cache_query("select user_id from topic_assistant where topic_id in (select contestset_id as topic_id from contest_set_list where contest_id = ?)", [contestId]);
    }

    @ErrorHandlerFactory(ok.okMaker)
    async getAllContestAssistantsByRequest(req: Request) {
        return await this.getAllContestAssistants();
    }

    @Cacheable(new CachePool<any>(), 1, "hour")
    async userIsContestAssistant (contestId: number | string, userId: string) {
        userId = userId.trim();
        const userList: any[] = await this.getContestAssistants(contestId);
        const topicUserList: any[] = await this.getTopicAssistant(contestId);
        return userList.filter(e => typeof e === "string").map(e => e.trim()).map(e => e.user_id).includes(userId) || topicUserList.filter(e => typeof e === "string").map(e => e.trim()).map(e => e.user_id).includes(userId);
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

    async setContestAssistantByTopicId (topicId: number | string, userId: string) {
        return await MySQLManager.execQuery("insert into topic_assistant(topic_id, user_id) values(?,?)",[topicId, userId]);
    }

    async setContestAssistantByTopicIdAndMultipleUserId (topicId: number | string, userIdList: string[]) {
        return Promise.all(userIdList.map(userId => this.setContestAssistantByTopicId(topicId, userId)));
    }

    async deleteTopicAssistantList(topicId: number | string) {
        return await MySQLManager.execQuery(`delete from topic_assistant where topic_id = ?`, [topicId]);
    }

    async updateTopicAssistantListByRequest(req: Request) {
        const topicAssistant = req.body.topicAssistant as string[];
        const topicId = req.body.contestSetId;
        await this.deleteTopicAssistantList(topicId);
        await this.setContestAssistantByTopicIdAndMultipleUserId(topicId, topicAssistant);
    }

    @ErrorHandlerFactory(ok.okMaker)
    async setContestAssistantByRequest (req: Request) {
        const contestId = req.body.contestId;
        const userId = req.body.userId;
        await this.setContestAssistant(contestId, userId);
        return {contestId, userId};
    }

    @ErrorHandlerFactory(ok.okMaker)
    async setContestAssistantByTopicByRequest (req: Request) {
        const topicId = req.params.topicId || req.body.topicId;
        const userId = req.body.userId;
        await this.setContestAssistantByTopicId(topicId, userId);
        return {topicId, userId};
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
