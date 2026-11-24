/**
 * 兼容外壳：旧调用方继续 require("infrastructure/db/legacy/mysql_cache")，行为与重构前一致：
 * - 固定 2s 进程内缓存（存放在 MySQLCachePool，键格式仍为 sql + JSON.stringify(sqlArr.toString())）；
 * - 未命中时按 SQL 子串（update/insert/delete）判定「写语句」并跳过缓存——该启发式只保留在这里，
 *   会把含这些字样的 SELECT 误判为写而永不缓存；
 * - opt.copy 只对命中缓存的返回值做深拷贝；并发未命中 single-flight。
 * 新代码请直接用 src/db 的 cachedQuery(sql, params, {ttlMs})，显式声明要缓存。
 */
import {cachedQueryByKey, LEGACY_CACHE_TTL_MS} from "..";

const query = require("./mysql_query");

function deepCopy(obj: any) {
	return JSON.parse(JSON.stringify(obj));
}

function modifySql(sql: string) {
	return sql.includes("update") || sql.includes("insert") || sql.includes("delete");
}

const cache_query = async function (sql: string, sqlArr: any[] = [], opt: any = {copy: 0}) {
	const identified = sql.toString() + JSON.stringify(sqlArr.toString());
	return cachedQueryByKey(identified, sql, sqlArr, LEGACY_CACHE_TTL_MS, {
		cacheOnMiss: () => !modifySql(sql.toLowerCase()),
		mapHit: (data: any) => opt.copy ? deepCopy(data) : data
	});
};

cache_query.pool = query.pool;

const _end = query.pool.end;
query.pool.end = function() {
	if(!this._closed) {
		_end.apply(this, arguments);
	}
};

export = cache_query;
