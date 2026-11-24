/**
 * 兼容外壳：旧调用方继续 require("infrastructure/db/legacy/mysql_query")，实际走 src/db 的 query（同一连接池）。
 * 新代码请直接 import { query } from "infrastructure/db"。
 */
import {MySQLManager} from "../mysql/MySQLManager";
import {query as dbQuery} from "..";

function query(sql_query: string, sqlArr?: any[], callback?: (...args: any[]) => any): any {
	if (typeof callback === "function") {
		// 旧式回调用法：保持 MySQLManager.execQuery 的回调语义（callback(results, fields)，错误被吞掉）
		return MySQLManager.execQuery(sql_query, sqlArr, callback);
	}
	return dbQuery(sql_query, sqlArr);
}

query.pool = MySQLManager.mysqlPool as typeof MySQLManager.mysqlPool & {_closed?: boolean};

const _end = query.pool.end;
query.pool.end = function(...args) {
	if(!this._closed) {
		_end.apply(this, args);
	}
};

export = query;
