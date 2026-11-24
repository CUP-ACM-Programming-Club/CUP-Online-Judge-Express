import Logger from "../../logging/console/Logger";

export interface MySQLTransaction {
    query: (sql: string, binding?: any[]) => Promise<any>;
    release: () => Promise<void>;
}

const END_TRANSACTION_REGEX = /^\s*(COMMIT|ROLLBACK)\s*;?\s*$/i;

/**
 * 在一条专用连接上真正开启事务（START TRANSACTION），返回 query/release 包装。
 *
 * - 调用方沿用 query("COMMIT") / query("ROLLBACK") 结束事务；
 * - release() 只会真正归还一次连接；若事务尚未结束（既没 COMMIT 也没 ROLLBACK），
 *   先回滚再归还，避免把开着事务的连接放回连接池污染后续请求；
 *   回滚失败则销毁该连接而不是放回池中。
 */
export function openTransaction(pool: any): Promise<MySQLTransaction> {
    return new Promise((resolve, reject) => {
        pool.getConnection((err: any, connection: any) => {
            if (err) {
                reject(err);
                return;
            }
            Logger.log("MySQL pool connected: threadId " + connection.threadId);
            connection.query("START TRANSACTION", (beginErr: any) => {
                if (beginErr) {
                    Logger.log("MySQL START TRANSACTION failed: threadId " + connection.threadId, beginErr);
                    discardConnection(connection);
                    reject(beginErr);
                    return;
                }
                resolve(wrapConnection(connection));
            });
        });
    });
}

function discardConnection(connection: any) {
    try {
        if (typeof connection.destroy === "function") {
            connection.destroy();
        } else {
            connection.release();
        }
    } catch (e) {
        Logger.log("MySQL discard connection failed", e);
    }
}

function rawQuery(connection: any, sql: string, binding?: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
        connection.query(sql, binding, (err: any, result: any) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(result);
        });
    });
}

function wrapConnection(connection: any): MySQLTransaction {
    let inTransaction = true;
    let released = false;

    const query = async (sql: string, binding?: any[]) => {
        const result = await rawQuery(connection, sql, binding);
        if (END_TRANSACTION_REGEX.test(sql)) {
            inTransaction = false;
        }
        return result;
    };

    const release = async () => {
        if (released) {
            Logger.log("MySQL transaction release called twice: threadId " + connection.threadId);
            return;
        }
        released = true;
        if (inTransaction) {
            try {
                await rawQuery(connection, "ROLLBACK");
                inTransaction = false;
                Logger.log("MySQL transaction not finished before release, rolled back: threadId " + connection.threadId);
            } catch (e) {
                Logger.log("MySQL rollback on release failed, destroying connection: threadId " + connection.threadId, e);
                discardConnection(connection);
                return;
            }
        }
        Logger.log("MySQL pool released: threadId " + connection.threadId);
        connection.release();
    };

    return { query, release };
}
