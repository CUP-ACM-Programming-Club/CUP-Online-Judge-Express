import { Request } from "express";
import { ErrorHandlerFactory } from "../../decorator/ErrorHandler";
import { ok } from "../../module/constants/state";
import { injectable, inject } from "inversify";
import { TYPES } from "../../di/types";
import { ConfigService } from "../../service/ConfigService";

const query = require("../../module/mysql_cache");
const encryptPassword = require("../../module/util").encryptPassword;
const getIP = require("../../module/getIP");
const legacySalt = global.config.salt || "thisissalt";

export interface UserInfoPayload {
    userId: string,
    password: string,
    confirmQuestion: string,
    nick: string,
    confirmAnswer: string
}

export interface ContestUserInfoPayload {
    userId: string,
    password: string,
    confirmQuestion: string,
    nick: string,
    confirmAnswer: string,
    school: string
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

@injectable()
/**
 * @deprecated Use src/service/admin/AdminUserService.ts for admin operations.
 * Core user logic should be moved to a specific UserService in the future.
 */
export class UserManager {
    private _configService?: ConfigService;

    constructor(@inject(TYPES.ConfigService) configService?: ConfigService) {
        this._configService = configService;
    }

    private get salt() {
        return this._configService ? this._configService.config.salt : legacySalt;
    }

    async addUser(userInfoPayload: UserInfoPayload, request: Request) {
        return await query(`insert into users(user_id, newpassword, confirmquestion, confirmanswer, nick, ip, reg_time, password, email)values(?,?,?,?,?,?,NOW(),'','')`,
            [userInfoPayload.userId, encryptPassword(userInfoPayload.password, this.salt), userInfoPayload.confirmQuestion,
            encryptPassword(userInfoPayload.confirmAnswer, this.salt), userInfoPayload.nick, getIP(request)]);
    }

    async addContestUser(userInfoPayload: ContestUserInfoPayload, request: Request) {
        return await query(`insert into users(user_id, newpassword, confirmquestion, confirmanswer, nick, ip, reg_time, password, email, school)values(?,?,?,?,?,?,NOW(),'','', ?)`,
            [userInfoPayload.userId, encryptPassword(userInfoPayload.password, this.salt), userInfoPayload.confirmQuestion,
            encryptPassword(userInfoPayload.confirmAnswer, this.salt), userInfoPayload.nick, getIP(request), userInfoPayload.school]);
    }

    async changePassword(userId: string, password: string) {
        return await query(`update users set newpassword = ? where user_id = ?`, [encryptPassword(password, this.salt), userId]);
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

    async getUserNick(userId: string) {
        const user = await this.getUser(userId);
        return null !== user && user.nick || "";
    }

    @ErrorHandlerFactory(ok.okMaker)
    async getUserEmailByRequest(req: Request) {
        return this.getUserEmail(req.params.user_id);
    }

    async hasUser(userId: string) {
        return (await this.getUser(userId)) !== null;
    }

    async updateUser(userId: string, payload: any) {
        const allowProps = [
            "newpassword", "nick", "school", "email", "blog", "github",
            "biography", "confirmquestion", "confirmanswer", "avatarUrl"
        ];
        const updateContent: any[] = [];
        const updateValues: any[] = [];

        allowProps.forEach(prop => {
            if (Object.prototype.hasOwnProperty.call(payload, prop) && payload[prop] !== undefined) {
                updateContent.push(`${prop} = ?`);
                updateValues.push(payload[prop]);
            }
        });

        if (updateContent.length === 0) {
            return;
        }

        updateValues.push(userId);
        await query(`UPDATE users SET ${updateContent.join(",")} WHERE user_id = ?`, updateValues);
        return;
    }
}

export default new UserManager();
