// @ts-ignore
import mysql from "mysql2";
const config: any = global.config || {};
const pool = mysql.createPool(config["mysql"]);

export class MySQLManager {
    static execQuery(sql_query: string, sqlArr?: any[], callback?: (...args: any[]) => any) {
        if (typeof callback === "function") {
            pool.query(sql_query, sqlArr, function (err: any, results: any, fields: any) {
                callback(results, fields);
            });
        }
        else {
            return new Promise((resolve, reject) => {
                pool.query(sql_query, sqlArr, function (err: any, results: any, fields: any) {
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
}
