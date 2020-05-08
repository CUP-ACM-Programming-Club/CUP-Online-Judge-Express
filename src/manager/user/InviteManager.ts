import dayjs from "dayjs";
import {Request} from "express";
import {MySQLManager} from "../mysql/MySQLManager";
import {ErrorHandler, ErrorHandlerFactory} from "../../decorator/ErrorHandler";
import {ok} from "../../module/constants/state";
import { v1 as uuidV1 } from "uuid";
const query = require("../../module/mysql_cache");

const PAGE_OFFSET = 50;

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

class InviteValidator {
    expireDateValidator(expireDate: string) {
        const formattedExpireDate = dayjs(expireDate);
        if (formattedExpireDate.isBefore(dayjs())) {
            throw new Error("Expire date should after now");
        }
    }

    validUserNumberValidator(validUserNumber: string | number) {
        if (typeof validUserNumber === "string") {
            validUserNumber = parseInt(validUserNumber);
        }
        if (validUserNumber <= 0) {
            throw new Error("Valid user number should larger than 0");
        }
    }
}

export class InviteManager {

    private inviteValidator = new InviteValidator();

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
                        } else if (!(results && results[0] && results[0].valid_time)) {
                            return connection.rollback(() => {
                                reject("Invite code doesn't exist");
                            })
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

    @ErrorHandlerFactory(ok.okMaker)
    async addInviteCodeByRequest(req: Request) {
        const userId = req.session!.user_id;
        const expireDate = timeToString(req.body.expireDate);
        const validUserNumber = parseInt(req.body.validUserNumber as string);
        this.inviteValidator.expireDateValidator(expireDate);
        this.inviteValidator.validUserNumberValidator(validUserNumber);
        return await this.addInviteCode(userId, expireDate, validUserNumber);
    }

    @ErrorHandlerFactory(ok.okMaker)
    async getAllInviteCode(): Promise<IInviteInfo[]> {
        return await query(`select * from invite order by valid_date desc`);
    }

    async getInviteCodeByConditional(page: number, offset: number): Promise<IInviteInfo[]> {
        return await query(`select * from invite order by valid_date limit ?, ?`, [page, offset]);
    }

    @ErrorHandlerFactory(ok.okMaker)
    async getInviteCodeByRequest(req: Request) {
        const page = req.params.page;
        let formattedPage: number;
        if (isNaN(parseInt(page))) {
            formattedPage = 0;
        }
        else {
            formattedPage = parseInt(page);
        }
        return this.getInviteCodeByConditional(formattedPage * PAGE_OFFSET, PAGE_OFFSET);
    }
}

export default new InviteManager();
