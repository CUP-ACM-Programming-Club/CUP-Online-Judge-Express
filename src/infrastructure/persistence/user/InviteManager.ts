import dayjs from "dayjs";
import {MySQLManager} from "../../db/mysql/MySQLManager";
import {ErrorHandler} from "../../../shared/decorators/ErrorHandler";
import {IInviteInfo, UserInviteRepository} from "../../../application/ports/UserInviteRepository";
import { v1 as uuidV1 } from "uuid";
import { query, cachedQuery, LEGACY_CACHE_TTL_MS } from "../../db";

/** 原先全部 SQL 都经 mysql_cache：select 走 2s 缓存，update/insert/delete 被识别为写语句直接查询 */
const CACHE = { ttlMs: LEGACY_CACHE_TTL_MS };

export type {IInviteInfo};

function timeToString(time: any) {
    return dayjs(time).format("YYYY-MM-DD HH:mm:ss");
}

/** 邀请码的数据访问（HTTP 部分在 interfaces/http/controllers/InviteController）。 */
export class InviteManager implements UserInviteRepository {

    async getInviteInfoByInviteCode (inviteCode: string) {
        const result = await cachedQuery(`select * from invite where invite_code = ?`, [inviteCode], CACHE);
        if (result && result.length && result.length > 0) {
            return result[0] as IInviteInfo;
        }
        return null;
    }

    async getInviteInfoByUserId(userId: string) {
        return await cachedQuery(`select * from invite where user_id = ?`, [userId], CACHE);
    }

    async expireInviteCode (inviteCode: string) {
        return await query(`update invite set valid_date = NOW() where invite_code = ?`, [inviteCode]);
    }

    async hasInviteCode (inviteCode: string) {
        return (await this.getInviteInfoByInviteCode(inviteCode)) !== null;
    }

    @ErrorHandler
    async consumeInviteCode(inviteCode: string) {
        const connection = await MySQLManager.getConnection();
        await new Promise(((resolve, reject) => {
            connection.beginTransaction(async (err: Error) => {
                if (err) {
                    reject(err);
                }
                else {
                    connection.query(`select * from invite where invite_code = ? and valid_date > NOW() for update`, [inviteCode], (error, results) => {
                        if (error) {
                            return connection.rollback(() => {
                                reject(error);
                            });
                        } else if (!(results && results[0] && results[0].valid_time)) {
                            return connection.rollback(() => {
                                reject("Invite code doesn't exist or has been expired.");
                            })
                        } else {
                            const restTime = results[0].valid_time;
                            if (restTime > 0) {
                                connection.query(`update invite set valid_time = valid_time - 1 where invite_code = ? and valid_time > 0`, [inviteCode], (error, results) => {
                                    if (error) {
                                        return connection.rollback(() => {
                                            reject(error);
                                        })
                                    }
                                    else if (results.affectedRows < 1) {
                                        return connection.rollback(() => {
                                            reject("consume invite code failed.");
                                        });
                                    }
                                    else {
                                        connection.commit((err: Error) => {
                                            if (err !== null) {
                                                connection.rollback(() => {
                                                    reject(err);
                                                })
                                            }
                                        });
                                        resolve(null);
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

    async deleteInviteRecord(inviteCode: string, inviter: string, userId: string) {
        return await query(`delete from invited_user where user_id = ? and inviter = ? and invite_code = ?`, [userId, inviter, inviteCode]);
    }

    async addInviteCode (user_id: string, expireDate: string, validUserNumber: number) {
        const inviteCode = uuidV1();
        expireDate = timeToString(expireDate);
        const result = await query(`insert into invite(user_id, invite_code, valid_date, valid_time)
                        values(?,?,?,?)`, [user_id, inviteCode, expireDate, validUserNumber]);
        return inviteCode;
    }

    async getAllInviteCode(): Promise<IInviteInfo[]> {
        return await cachedQuery(`select * from invite order by valid_date desc`, undefined, CACHE);
    }

    async getInviteCodeByConditional(page: number, offset: number): Promise<IInviteInfo[]> {
        return await cachedQuery(`select * from invite order by valid_date limit ?, ?`, [page, offset], CACHE);
    }

}

export default new InviteManager();
