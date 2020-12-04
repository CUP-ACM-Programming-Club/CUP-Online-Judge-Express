// @ts-ignore
import mysql from "mysql2";
import {Pool, PoolConnection, Query, queryCallback, QueryOptions} from "mysql";
const config: any = global.config || {};
const pool = mysql.createPool(config["mysql"]) as any as Pool;

interface MySQLTransaction {
    query: (options: string | QueryOptions, values?: any, callback?: queryCallback) => Query;
    release: () => void
}

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
                        reject({error:err, sql: sql_query, args: sqlArr});
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
    static getConnection() : Promise<PoolConnection> {
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

    static transaction(): Promise<MySQLTransaction> {
        return new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err) reject(err);
                console.log("MySQL pool connected: threadId " + connection.threadId);
                const query = (sql: string, binding: any[]) => {
                    return new Promise((resolve, reject) => {
                        connection.query(sql, binding, (err, result) => {
                            if (err) reject(err);
                            resolve(result);
                        });
                    });
                };
                const release = () => {
                    return new Promise((resolve, reject) => {
                        if (err) reject(err);
                        console.log("MySQL pool released: threadId " + connection.threadId);
                        resolve(connection.release());
                    });
                };
                resolve({query, release} as unknown as MySQLTransaction);
            });
        });
    }
}
