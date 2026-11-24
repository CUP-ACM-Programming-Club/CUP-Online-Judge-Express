/**
 * 统一数据访问入口。新代码请只用这里的三个函数：
 *
 *   query<T>(sql, params)                 —— 直接查询（连接池）
 *   cachedQuery<T>(sql, params, {ttlMs})  —— 显式读缓存（进程内、按 SQL+参数为键，带 single-flight）
 *   tx(fn)                                —— 事务：fn 正常返回则 COMMIT，抛错则 ROLLBACK，最后归还连接
 *
 * 实现说明：
 * - 连接池与旧代码共用 MySQLManager.mysqlPool，连接使用方式不变；事务基于 openTransaction。
 * - 缓存存放在 MySQLCachePool（与 module/mysql_cache 同一个池），所以后台「清除 MySQL 缓存」对两者都生效。
 *   该池由 CacheScheduler 每 60s 清扫一次「早于 2s」的条目：ttlMs > 2000 的条目可能被提前清掉
 *   （只会多一次回源，不影响正确性）。
 * - cachedQuery 返回的是缓存里的共享对象，调用方不要原地修改。
 * - module/mysql_query、module/mysql_cache 现在只是这里的兼容外壳，旧调用方无需改动。
 */
import { MySQLManager } from "./mysql/MySQLManager";
import CacheScheduler from "../../shared/cache/CacheScheduler";
import { createDb } from "./core";

export type { TxContext, CachedQueryOptions, Db } from "./core";

const MySQLCachePool = require("./legacy/mysql/cache");

/** 旧 mysql_cache 的固定缓存时长 */
export const LEGACY_CACHE_TTL_MS = 2000;

CacheScheduler.addCacheContainer({
    cacheContainer: MySQLCachePool,
    timeDelta: LEGACY_CACHE_TTL_MS / 1000,
    timeUnit: "second"
});

const db = createDb({
    execQuery: (sql, params) => MySQLManager.execQuery(sql, params),
    transaction: () => MySQLManager.transaction(),
    cache: MySQLCachePool
});

export const query = db.query;
export const cachedQuery = db.cachedQuery;
export const tx = db.tx;
export const cachedQueryByKey = db.cachedQueryByKey;

export default db;
