import {MySQLManager} from "../mysql/MySQLManager";
import {Request} from "express";
import Cacheable from "../../decorator/Cacheable";
import CachePool from "../../module/common/CachePool";
import {ErrorHandlerFactory} from "../../decorator/ErrorHandler";
import {ok} from "../../module/constants/state";
const PAGE_OFFSET = 50;
interface IContestSetDAO {
    contestset_id: number,
    title: string,
    creator: string,
    description: string,
    create_time: string,
    visible: boolean,
    defunct: boolean
}

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
            return " where defunct = 0 and visible = 1 ";
        }
    }

    @ErrorHandlerFactory(ok.okMaker)
    async getContestSetByRequest(req: Request) {
        const page = isNaN(parseInt(req.query.page)) ? 0 : parseInt(req.query.page);
        const isAdministrator = req.session!.isadmin;
        return await this.getContestSetByConditional(this.buildAdminSQL(isAdministrator), page);
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

    async hasLimitToAccessContestSet(req: Request, contestSetId: string | number) {
        if (req.session!.isadmin) {
            return true;
        }
        else {
            const response = await this.getContestSetByContestSetId(contestSetId);
            return response?.defunct === false && response.visible;
        }
    }
}

export default new ContestSetManager();
