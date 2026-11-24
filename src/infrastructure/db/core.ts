import dayjs from "dayjs";
import type { ICachePool } from "../../shared/cache/CachePool";
import type { MySQLTransaction } from "./mysql/transaction";

/**
 * 统一数据访问层的实现（与具体连接池解耦，便于单测）。
 * 生产装配见 ./index.ts：连接池仍是 MySQLManager 的那一个，缓存仍是 module/mysql/cache 的 MySQLCachePool。
 */

export interface TxContext {
    query<T = any>(sql: string, params?: any[]): Promise<T>;
}

export interface CachedQueryOptions {
    /** 缓存有效期（毫秒）。超过后下次读取会回源刷新。 */
    ttlMs: number;
}

export interface DbDeps {
    /** 走连接池的单条查询；失败时 reject（形状由底层决定，MySQLManager 为 {error, sql, args}） */
    execQuery(sql: string, params?: any[]): Promise<any>;
    /** 取一条专用连接并 START TRANSACTION（MySQLManager.transaction → openTransaction） */
    transaction(): Promise<MySQLTransaction>;
    cache: ICachePool;
}

export interface Db {
    query<T = any>(sql: string, params?: any[]): Promise<T>;
    cachedQuery<T = any>(sql: string, params: any[] | undefined, options: CachedQueryOptions): Promise<T>;
    tx<T>(fn: (t: TxContext) => Promise<T>): Promise<T>;
    /**
     * 以调用方给定的缓存键做读穿透缓存。仅供兼容层（module/mysql_cache）沿用旧键格式与旧行为使用，新代码用 cachedQuery。
     */
    cachedQueryByKey<T = any>(key: string, sql: string, params: any[] | undefined, ttlMs: number, options?: CachedByKeyOptions): Promise<T>;
}

export interface CachedByKeyOptions {
    /** 返回 false 时，未命中则直接查询且不写缓存（旧版「看起来像写语句」的判断） */
    cacheOnMiss?: () => boolean;
    /** 命中缓存（含过期后刷新）时对返回值的变换（旧版 opt.copy 只作用于这两条路径） */
    mapHit?: (data: any) => any;
}

export function cacheKeyOf(sql: string, params: any[] = []) {
    return `db:${sql}\u0000${JSON.stringify(params)}`;
}

export function createDb(deps: DbDeps): Db {
    // Single-flight：同一缓存键的并发未命中/过期刷新只打一次数据库
    const inflight: Map<string, Promise<any>> = new Map();

    function runOnce(key: string, sql: string, params: any[]) {
        const existing = inflight.get(key);
        if (existing) {
            return existing;
        }
        const p = (async () => {
            try {
                return await deps.execQuery(sql, params);
            } finally {
                inflight.delete(key);
            }
        })();
        inflight.set(key, p);
        return p;
    }

    function query<T = any>(sql: string, params?: any[]): Promise<T> {
        return deps.execQuery(sql, params);
    }

    async function cachedQueryByKey<T = any>(key: string, sql: string, params: any[] = [], ttlMs: number, options: CachedByKeyOptions = {}): Promise<T> {
        const now = dayjs();
        const cache = await deps.cache.get(key);
        if (cache) {
            let data = cache.data;
            if (cache.time.add(ttlMs, "millisecond").isBefore(now)) {
                const value = await runOnce(key, sql, params);
                // 与旧版一致：过期刷新时不等待写缓存完成
                deps.cache.set(key, value);
                data = value;
            }
            return options.mapHit ? options.mapHit(data) : data;
        }
        if (options.cacheOnMiss && !options.cacheOnMiss()) {
            return deps.execQuery(sql, params);
        }
        const resp = await runOnce(key, sql, params);
        await deps.cache.set(key, resp);
        return resp;
    }

    function cachedQuery<T = any>(sql: string, params: any[] | undefined, options: CachedQueryOptions): Promise<T> {
        if (!options || typeof options.ttlMs !== "number" || !(options.ttlMs >= 0)) {
            throw new TypeError("cachedQuery requires options.ttlMs (milliseconds)");
        }
        return cachedQueryByKey<T>(cacheKeyOf(sql, params || []), sql, params || [], options.ttlMs);
    }

    async function tx<T>(fn: (t: TxContext) => Promise<T>): Promise<T> {
        const conn = await deps.transaction();
        try {
            const result = await fn({ query: (sql: string, params?: any[]) => conn.query(sql, params) });
            await conn.query("COMMIT");
            return result;
        } catch (e) {
            try {
                await conn.query("ROLLBACK");
            } catch (_) {
                // release() 发现事务仍未结束会再回滚一次，仍失败则销毁连接，不会把脏连接放回池
            }
            throw e;
        } finally {
            await conn.release();
        }
    }

    return { query, cachedQuery, tx, cachedQueryByKey };
}
