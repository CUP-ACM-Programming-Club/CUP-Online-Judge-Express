import { MySQLManager } from "../../db/mysql/MySQLManager";
import { ContestAssistantRepository } from "../../../application/ports/ContestAssistantRepository";
import Cacheable from "../../../shared/cache/Cacheable";
import CachePool from "../../../shared/cache/CachePool";

const cache_query = require("../../db/legacy/mysql_cache");

/** 比赛 / 专题助教的数据访问；按请求取参数的部分在 interfaces/http/controllers/ContestAssistantController。 */
class ContestAssistantManager implements ContestAssistantRepository {
    async getContestAssistants(contestId: number | string) {
        return await cache_query("select user_id from contest_assistant where contest_id = ?", [contestId]);
    }

    async getAllContestAssistants() {
        return await cache_query("select user_id, contest_id from contest_assistant");
    }

    async getTopicAssistant(contestId: number | string) {
        return await cache_query("select user_id from topic_assistant where topic_id in (select contestset_id as topic_id from contest_set_list where contest_id = ?)", [contestId]);
    }

    @Cacheable(new CachePool<any>(), 1, "hour")
    async userIsContestAssistant(contestId: number | string, userId: string) {
        userId = userId.trim();
        const userList: any[] = await this.getContestAssistants(contestId);
        const topicUserList: any[] = await this.getTopicAssistant(contestId);
        return userList.map(e => e.user_id).filter(e => typeof e === "string").map(e => e.trim()).includes(userId) || topicUserList.map(e => e.user_id).filter(e => typeof e === "string").map(e => e.trim()).includes(userId);
    }

    async setContestAssistant(contestId: number | string, userId: string) {
        return await MySQLManager.execQuery("insert into contest_assistant(contest_id, user_id) values(?,?)", [contestId, userId]);
    }

    async removeContestAssistant(contestId: number | string, userId: string) {
        return await MySQLManager.execQuery("delete from contest_assistant where contest_id = ? and user_id = ?", [contestId, userId]);
    }

    async setContestAssistantByTopicId(topicId: number | string, userId: string) {
        return await MySQLManager.execQuery("insert into topic_assistant(topic_id, user_id) values(?,?)", [topicId, userId]);
    }

    async setContestAssistantByTopicIdAndMultipleUserId(topicId: number | string, userIdList: string[]) {
        return Promise.all(userIdList.map(userId => this.setContestAssistantByTopicId(topicId, userId)));
    }

    async deleteTopicAssistantList(topicId: number | string) {
        return await MySQLManager.execQuery(`delete from topic_assistant where topic_id = ?`, [topicId]);
    }
}

export default new ContestAssistantManager();
