import {Request} from "express";
import {ErrorHandlerFactory} from "../../decorator/ErrorHandler";
import {ok} from "../../module/constants/state";
const query = require("../../module/mysql_cache");
const encryptPassword = require("../../module/util").encryptPassword;
const getIP = require("../../module/getIP");
const salt = global.config.salt || "thisissalt";

export interface UserInfoPayload {
    userId: string,
    password: string,
    confirmQuestion: string,
    nick: string,
    confirmAnswer: string
}

export interface UserInfoDAO {
    user_id: string,
    password: string,
    newpassword: string,
    nick: string,
    school: string,
    email: string,
    reg_time: string,
    ip: string,
    confirmquestion: string,
    confirmanswer: string
}

export class UserManager {
    async addUser(userInfoPayload: UserInfoPayload, request: Request) {
        return await query(`insert into users(user_id, newpassword, confirmquestion, confirmanswer, nick, ip, reg_time, password, email)values(?,?,?,?,?,?,NOW(),'','')`,
            [userInfoPayload.userId, encryptPassword(userInfoPayload.password, salt), userInfoPayload.confirmQuestion,
            encryptPassword(userInfoPayload.confirmAnswer, salt), userInfoPayload.nick, getIP(request)]);
    }

    async changePassword(userId: string, password: string) {
        return await query(`update users set newpassword = ? where user_id = ?`, [encryptPassword(password, salt), userId]);
    }

    async getUser(userId: string): Promise<UserInfoDAO | null> {
        const result = await query(`select * from users where user_id = ?`, [userId]);
        if (result && result.length && result.length > 0) {
            return result[0];
        }
        else {
            return null;
        }
    }

    async getUserEmail(userId: string): Promise<string> {
        const user = await this.getUser(userId);
        if (user !== null) {
            return user.email;
        }
        else {
            return "";
        }
    }

    @ErrorHandlerFactory(ok.okMaker)
    async getUserEmailByRequest(req: Request) {
        return this.getUserEmail(req.params.user_id);
    }

    async hasUser(userId: string) {
        return (await this.getUser(userId)) !== null;
    }
}

export default new UserManager();
