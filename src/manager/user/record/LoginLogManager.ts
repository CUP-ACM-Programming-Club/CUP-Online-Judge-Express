import {MySQLManager} from "../../mysql/MySQLManager";
import {Request} from "express";
import {ErrorHandlerFactory} from "../../../decorator/ErrorHandler";
import {ok} from "../../../module/constants/state";
const PAGE_LIMIT = 50;

export interface ILoginLogDAO {
    user_id: string,
    password: string,
    ip: string,
    time: string,
    browser_name?: string,
    browser_version?: string,
    os_name?: string,
    os_version?: string
}

class LoginLogManager {
    async getLatestLoginLog (): Promise<ILoginLogDAO[]> {
        return await MySQLManager.execQuery(`select * from loginlog order by time desc limit ?`, [PAGE_LIMIT]);
    }

    async getUserIdLoginLog (userId: string, page: number): Promise<ILoginLogDAO[]> {
        return await MySQLManager.execQuery(`select * from loginlog where user_id = ? order by time desc limit ?, ?`, [userId, page * PAGE_LIMIT, PAGE_LIMIT]);
    }

    @ErrorHandlerFactory(ok.okMaker)
    async getLatestLoginLogByRequest(req: Request) {
        return await this.getLatestLoginLog();
    }

    @ErrorHandlerFactory(ok.okMaker)
    async getUserLoginLogByRequest(req: Request) {
        const userId = req.params.userId;
        const page = isNaN(parseInt(req.query.page)) ? 0 : parseInt(req.query.page);
        return await this.getUserIdLoginLog(userId, page);
    }
}

export default new LoginLogManager();
