import {Request} from "express";
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

export class UserManager {
    async addUser(userInfoPayload: UserInfoPayload, request: Request) {
        console.log(userInfoPayload);
        await query(`insert into users(user_id, password, confirmquestion, confirmanswer, nick, ip)values(?,?,?,?,?,?)`,
            [userInfoPayload.userId, encryptPassword(userInfoPayload.password, salt), userInfoPayload.confirmQuestion,
            encryptPassword(userInfoPayload.confirmAnswer, salt), userInfoPayload.nick, getIP(request)]);
    }

    async getUser(userId: string) {
        const result = await query(`select * from users where user_id = ?`, [userId]);
        if (result && result.length && result.length > 0) {
            return result[0];
        }
        else {
            return null;
        }
    }

    async hasUser(userId: string) {
        return (await this.getUser(userId)) !== null;
    }
}

export default new UserManager();
