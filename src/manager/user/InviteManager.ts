import dayjs from "dayjs";
import {MySQLManager} from "../mysql/MySQLManager";
import {ErrorHandler} from "../../decorator/ErrorHandler";
const query = require("../../module/mysql_cache");
const uuidV1 = require("uuid/v1");

export interface IInviteInfo {
    invite_id: number,
    user_id: string,
    invite_code: string,
    valid_date: number | string,
    valid_time: number
}

function timeToString(time: any) {
    return dayjs(time).format("YYYY-MM-DD HH:mm:ss");
}

export class InviteManager {
    async getInviteInfoByInviteCode (inviteCode: string) {
        const result = await query(`select * from invite where invite_code = ?`, [inviteCode]);
        if (result && result.length && result.length > 0) {
            return result[0] as IInviteInfo;
        }
        return null;
    }

    async getInviteInfoByUserId(userId: string) {
        return await query(`select * from invite where user_id = ?`, [userId]);
    }

    async hasInviteCode (inviteCode: string) {
        return (await this.getInviteInfoByInviteCode(inviteCode)) !== null;
    }

    @ErrorHandler
    async consumeInviteCode(inviteCode: string) {
        const connection: any = await MySQLManager.getConnection();
        await new Promise(((resolve, reject) => {
            connection.beginTransaction(async (err: Error) => {
                if (err) {
                    reject(err);
                }
                else {
                    connection.query(`select * from invite where invite_code = ? for update`, [inviteCode], (error: Error, results: any) => {
                        if (error) {
                            return connection.rollback(() => {
                                reject(error);
                            });
                        } else {
                            const restTime = results[0].valid_time;
                            if (restTime > 0) {
                                connection.query(`update invite set valid_time = valid_time - 1 where invite_code = ?`, [inviteCode], (error: Error, results: any) => {
                                    if (error) {
                                        return connection.rollback(() => {
                                            reject(error);
                                        })
                                    }
                                    else {
                                        connection.commit((err: Error) => {
                                            if (err !== null) {
                                                connection.rollback(() => {
                                                    reject(err);
                                                })
                                            }
                                        });
                                        resolve();
                                    }
                                });
                            }
                        }
                    });
                }
            });
        }));
        connection.release();
    }

    async addInviteRecord(inviteCode: string, inviter: string, userId: string) {
        return await query(`insert into invited_user(user_id, inviter, invite_date, invite_code)values(?,?,NOW(),?)`,
            [userId, inviter, inviteCode]);
    }

    async addInviteCode (user_id: string, expireDate: string, validUserNumber: number) {
        const inviteCode = uuidV1();
        expireDate = timeToString(expireDate);
        const result = await query(`insert into invite(user_id, invite_code, valid_date, valid_time)
                        values(?,?,?,?)`, [user_id, inviteCode, expireDate, validUserNumber]);
        return inviteCode;
    }
}

export default new InviteManager();
