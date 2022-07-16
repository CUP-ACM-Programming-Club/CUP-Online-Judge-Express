import {MySQLManager} from "../mysql/MySQLManager";
import {Request} from "express";
import Cacheable from "../../decorator/Cacheable";
import CachePool from "../../module/common/CachePool";
import {ErrorHandlerFactory} from "../../decorator/ErrorHandler";
import {ok} from "../../module/constants/state";
import ContestSetListManager from "./ContestSetListManager";
import ContestManager from "../contest/ContestManager";
const PAGE_OFFSET = 50;


interface IContestSetDTO {
    contestSetId?: number,
    title: string,
    creator?: string,
    description: string,
    visible: boolean,
    defunct: string
}

interface IContestSetDAO extends IContestSetDTO{
    contestset_id: number,
    create_time: string,
}

export interface ITopicAssistantDAO {
    topic_id: number,
    topic_assistant_id: number,
    user_id: string
}

class ContestSetPayloadValidator {

    formatDefunct(defunct: any) {
        if (typeof defunct === "string") {
            if (defunct === "Y" || defunct === "N") {
                return defunct;
            }
            else {
                return "N";
            }
        }
        else {
            return !!defunct ? "Y" : "N";
        }
    }

    contestSetIdValidate(contestSetId: any) {
        contestSetId = parseInt(contestSetId);
        if (isNaN(contestSetId)) {
            throw new Error("Contest Set ID must be number");
        }
        else {
            return contestSetId;
        }
    }

    validate(payload: any) {
        const contestPayload = payload as IContestSetDTO;
        contestPayload.defunct = this.formatDefunct(contestPayload.defunct);
        return contestPayload;
    }
}

class ContestSetManager {
    validator = new ContestSetPayloadValidator();
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

    @ErrorHandlerFactory(ok.okMaker)
    async getContestSetByRequest(req: Request) {
        const page = isNaN(parseInt(req.query.page as string)) ? 0 : parseInt(req.query.page as string);
        const isAdministrator = req.session!.isadmin;
        return await this.getContestSetByConditional(this.buildAdminSQL(isAdministrator), page);
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

    async addContestSetByRequest(req: Request) {
        const body = req.body;
        body.creator = req.session!.user_id;
        const payload = this.validator.validate(body);
        const response = await this.addContestSetByDTO(payload);
        return response.insertId as number;
    }

    async updateContestSetByRequest(req: Request) {
        const payload = this.validator.validate(req.body);
        await this.updateContestSetByDTO(payload);
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

    async mergeContestSetInfoAndTopicAssistantInfo(contestSetId: number | string) {
        const [contestSetInfo, topicAssistantInfoList, userList] = await Promise.all([this.getContestSetByContestSetId(contestSetId), this.getTopicAssistantByContestSetId(contestSetId), this.getAllCompetitorByContestSetId(contestSetId)]) ;
        return Object.assign(contestSetInfo as any, {assistant: topicAssistantInfoList}, {userList});
    }

    @ErrorHandlerFactory(ok.okMaker)
    async getContestSetByContestSetIdByRequest(req: Request) {
        const contestSetId = this.validator.contestSetIdValidate(req.params.contestSetId);
        return await this.getContestSetByContestSetId(contestSetId);
    }

    @ErrorHandlerFactory(ok.okMaker)
    async getContestSetForAdministratorByContestSetIdByRequest(req: Request) {
        const contestSetId = this.validator.contestSetIdValidate(req.params.contestSetId);
        return await this.mergeContestSetInfoAndTopicAssistantInfo(contestSetId);
    }

    async hasLimitToAccessContestSet(req: Request, contestSetId: string | number) {
        if (req.session!.isadmin) {
            return true;
        }
        else {
            const response = await this.getContestSetByContestSetId(contestSetId);
            return response!.defunct === "N";
        }
    }
}

export default new ContestSetManager();
