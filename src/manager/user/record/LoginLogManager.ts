import {MySQLManager} from "../../mysql/MySQLManager";
import {Request} from "express";
import {ErrorHandlerFactory} from "../../../decorator/ErrorHandler";
import {ok} from "../../../module/constants/state";
import dayjs from "dayjs";
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

export interface ILoginLogDTO {
    os_name: string,
    os_version: string,
    browser_name: string,
    browser_version: string
}

class LoginLogManager {
    async getLatestLoginLog (): Promise<ILoginLogDAO[]> {
        return await MySQLManager.execQuery(`select * from loginlog order by time desc limit ?`, [PAGE_LIMIT]);
    }

    async getUserIdLoginLog (userId: string, page: number): Promise<ILoginLogDAO[]> {
        return await MySQLManager.execQuery(`select * from loginlog where user_id = ? order by time desc limit ?, ?`, [userId, page * PAGE_LIMIT, PAGE_LIMIT]);
    }

    async setUserIdLoginLog (userId: string, loginLogDTO: ILoginLogDTO, ip: string) {
        const {browser_name, browser_version, os_name, os_version} = loginLogDTO;
        await MySQLManager.execQuery("insert into loginlog (user_id, password, ip, time, browser_name, browser_version, os_name, os_version) values(?,?,?,?,?,?,?,?)",
            [userId, "No Saved", ip, dayjs().format("YYYY-MM-DD HH:mm:ss"), browser_name, browser_version, os_name, os_version]);
    }

    @ErrorHandlerFactory(ok.okMaker)
    async setUserIdLoginLogByRequest(req: Request) {
        const userId = req.session!.user_id;
        // @ts-ignore
        const ip = req.clientIp;
        await  this.setUserIdLoginLog(userId, req.body, ip);
    }

    @ErrorHandlerFactory(ok.okMaker)
    async getLatestLoginLogByRequest(req: Request) {
        return await this.getLatestLoginLog();
    }

    @ErrorHandlerFactory(ok.okMaker)
    async getUserLoginLogByRequest(req: Request) {
        const userId = req.params.userId;
        const page = isNaN(parseInt(req.query.page as string)) ? 0 : parseInt(req.query.page as string);
        return await this.getUserIdLoginLog(userId, page);
    }
}

export default new LoginLogManager();
