import {MySQLManager} from "../../db/mysql/MySQLManager";
import Cacheable from "../../../shared/cache/Cacheable";
import CachePool from "../../../shared/cache/CachePool";
import ContestSetListManager from "./ContestSetListManager";
import ContestManager from "../contest/ContestManager";
import { ContestSetDAO as IContestSetDAO, ContestSetDTO as IContestSetDTO } from "../../../application/ports/ContestSetRepository";
const PAGE_OFFSET = 50;


export interface ITopicAssistantDAO {
    topic_id: number,
    topic_assistant_id: number,
    user_id: string
}

/** 比赛集（contest_set）的数据访问；校验与按请求取参数在 application/contestset/ContestSetUseCases。 */
class ContestSetManager {
    async getAllContestSet (): Promise<IContestSetDAO[]> {
        return await MySQLManager.execQuery(`select * from contest_set`);
    }

    @Cacheable(new CachePool(), 30, "second")
    async getContestSetByConditional(whereClause: string, page: number) {
        return await MySQLManager.execQuery(`select * from contest_set ${whereClause} order by create_time desc limit ?, ?`,[page * PAGE_OFFSET, PAGE_OFFSET]);
    }

    buildAdminSQL(isAdmin: boolean) {
        if (isAdmin) {
            return ""
        }
        else {
            return " where defunct = 'N' and visible = 1 ";
        }
    }

    async addContestSetByDTO(payload: IContestSetDTO) {
        const {creator, title, defunct, description, visible} = payload;
        return await MySQLManager.execQuery(`insert into contest_set
(creator, title, description, visible, defunct) values(?,?,?,?,?)`, [creator!, title, description, visible, defunct]);
    }

    async updateContestSetByDTO(payload: IContestSetDTO) {
        const {title, defunct, description, visible, contestSetId} = payload;
        return await MySQLManager.execQuery(`update contest_set set 
title = ?, description = ?, visible = ?, defunct = ? where contestset_id = ?`,
            [title, description, visible, defunct, contestSetId!]);
    }

    async getContestSetByContestSetId(contestSetId: number | string) {
        const response = await MySQLManager.execQuery(`select * from contest_set where contestset_id = ?`, [contestSetId]);
        if (response && response.length && response.length > 0) {
            return response[0] as IContestSetDAO;
        }
        else {
            return null;
        }
    }

    async getTopicAssistantByContestSetId(contestSetId: number | string) {
        const response = await MySQLManager.execQuery(`select * from topic_assistant where topic_id = ?`, [contestSetId]);
        if (response && response.length && response.length > 0) {
            return response as ITopicAssistantDAO[];
        }
        else {
            return null;
        }
    }

    async getAllCompetitorByContestSetId(contestSetId: number | string) {
        const contestIdList = (await ContestSetListManager.getContestSetListByContestSetId(contestSetId)).map(e => e.contest_id);
        const userList = await Promise.all(contestIdList.map(e => ContestManager.getContestCompetitorByContestId(e)));
        const userSet = new Set<string>();
        userList.forEach((e: any[]) => e.forEach(userWrapper => userSet.add(userWrapper.user_id)));
        return Array.from(userSet);
    }
}

export default new ContestSetManager();
