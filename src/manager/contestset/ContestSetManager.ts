import {MySQLManager} from "../mysql/MySQLManager";
import {Request} from "express";
import Cacheable from "../../decorator/Cacheable";
import CachePool from "../../module/common/CachePool";
import {ErrorHandlerFactory} from "../../decorator/ErrorHandler";
import {ok} from "../../module/constants/state";
const PAGE_OFFSET = 50;


interface IContestSetDTO {
    contestset_id?: number,
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
        const page = isNaN(parseInt(req.query.page)) ? 0 : parseInt(req.query.page);
        const isAdministrator = req.session!.isadmin;
        return await this.getContestSetByConditional(this.buildAdminSQL(isAdministrator), page);
    }

    async addContestSetByDTO(payload: IContestSetDTO) {
        const {creator, title, defunct, description, visible} = payload;
        return await MySQLManager.execQuery(`insert into contest_set
(creator, title, description, visible, defunct) values(?,?,?,?,?)`, [creator!, title, description, visible, defunct]);
    }

    async updateContestSetByDTO(payload: IContestSetDTO) {
        const {creator, title, defunct, description, visible, contestset_id} = payload;
        return await MySQLManager.execQuery(`update contest_set set 
creator = ?, title = ?, description = ?, visible = ?, defunct = ? where contestset_id = ?`,
            [creator, title, description, visible, defunct, contestset_id!]);
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

    @ErrorHandlerFactory(ok.okMaker)
    async getContestSetByContestSetIdByRequest(req: Request) {
        const contestSetId = this.validator.contestSetIdValidate(req.params.contestSetId);
        return await this.getContestSetByContestSetId(contestSetId);
    }

    async hasLimitToAccessContestSet(req: Request, contestSetId: string | number) {
        if (req.session!.isadmin) {
            return true;
        }
        else {
            const response = await this.getContestSetByContestSetId(contestSetId);
            return response?.defunct === "N" && response.visible;
        }
    }
}

export default new ContestSetManager();
