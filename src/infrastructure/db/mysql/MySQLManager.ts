// @ts-ignore
import mysql from "mysql2";
import { Pool, PoolConnection, Query, queryCallback, QueryOptions } from "mysql";
import Logger from "../../logging/console/Logger";
import { MySQLTransaction, openTransaction } from "./transaction";

export type { MySQLTransaction };
// @ts-ignore
const config: any = global.config || {};
const pool = mysql.createPool(config["mysql"]) as any as Pool;


export class MySQLManager {
    static mysqlPool = pool;
    static execQuery(sql_query: string, sqlArr?: any[], callback?: (...args: any[]) => any): any {
        if (typeof callback === "function") {
            pool.query(sql_query, sqlArr, function (err, results, fields) {
                callback(results, fields);
            });
        }
        else {
            return new Promise((resolve, reject) => {
                pool.query(sql_query, sqlArr, function (err, results, fields) {
                    if (err) {
                        reject({ error: err, sql: sql_query, args: sqlArr });
                    }
                    else {
                        // @ts-ignore
                        resolve(results, fields);
                    }
                });
            });
        }
        //connection.end();
    }
    static getConnection(): Promise<PoolConnection> {
        return new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err !== null) {
                    reject(err);
                }
                else {
                    resolve(connection);
                }
            });
        })
    }

    /**
     * 从连接池取一条专用连接并开启事务（START TRANSACTION）。
     * 调用方必须在所有路径上 query("COMMIT") 或 query("ROLLBACK")，并在 finally 中 release() 一次。
     */
    static transaction(): Promise<MySQLTransaction> {
        return openTransaction(MySQLManager.mysqlPool);
    }
}
