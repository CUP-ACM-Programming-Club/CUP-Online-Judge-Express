import {MySQLManager} from "../../../db/mysql/MySQLManager";
import dayjs from "dayjs";
import {ILoginLogDAO, ILoginLogDTO, UserLoginLogRepository} from "../../../../application/ports/UserLoginLogRepository";
const PAGE_LIMIT = 50;

export type {ILoginLogDAO, ILoginLogDTO};

/** 登录日志的数据访问（HTTP 部分在 interfaces/http/controllers/LoginLogController）。 */
class LoginLogManager implements UserLoginLogRepository {
    async getLatestLoginLog (): Promise<ILoginLogDAO[]> {
        return await MySQLManager.execQuery(`select loginlog.*, users.nick from loginlog left join users on users.user_id = loginlog.user_id order by time desc limit ?`, [PAGE_LIMIT]);
    }

    async getUserIdLoginLog (userId: string, page: number): Promise<ILoginLogDAO[]> {
        return await MySQLManager.execQuery(`select loginlog.*, users.nick from loginlog left join users on users.user_id = loginlog.user_id where loginlog.user_id = ? order by time desc limit ?, ?`, [userId, page * PAGE_LIMIT, PAGE_LIMIT]);
    }

    async setUserIdLoginLog (userId: string, loginLogDTO: ILoginLogDTO, ip: string) {
        const {browser_name, browser_version, os_name, os_version} = loginLogDTO;
        await MySQLManager.execQuery("insert into loginlog (user_id, password, ip, time, browser_name, browser_version, os_name, os_version) values(?,?,?,?,?,?,?,?)",
            [userId, "No Saved", ip, dayjs().format("YYYY-MM-DD HH:mm:ss"), browser_name, browser_version, os_name, os_version]);
    }
}

export default new LoginLogManager();
