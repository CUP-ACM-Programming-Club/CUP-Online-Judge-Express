/**
 * 测试辅助：仓储从旧外壳（legacy/mysql_cache、legacy/mysql_query）改走 infrastructure/db 的 query / cachedQuery 之后，
 * 老测试原先「Module._load 拦截 mysql_cache / mysql_query 并返回 sinon 桩」的写法改为：
 *
 *   if (isDbModuleRequest(request)) return dbModuleStub({ query: queryStub, cachedQuery: cacheQueryStub });
 *
 * - 转给桩的参数与原先直接桩旧外壳时一样：(sql) 或 (sql, params)；cachedQuery 的 options 不转给桩，
 *   但会校验它就是旧 mysql_cache 的固定 2s（LEGACY_CACHE_TTL_MS），不是就抛错。
 * - 没给的那一个仍落到 mock-external 里的假 db（与原先没拦截的旧外壳落到 fake-db 一致）。
 */
// 在任何测试装上拦截之前取得 mock-external 里的假 db，避免之后的 require 被拦截成桩自身
const fallbackDb = require("../../infrastructure/db");

export const LEGACY_CACHE_TTL_MS = 2000;

/** 仓储里对 infrastructure/db 的 require（"../../db"、"../../../infrastructure/db" 等） */
export function isDbModuleRequest(request: string) {
	return /(^|\/)db$/.test(request);
}

type Stub = (...args: any[]) => any;

export function dbModuleStub(stubs: { query?: Stub, cachedQuery?: Stub }) {
	const args = (sql: string, params?: any[]) => params === undefined ? [sql] : [sql, params];
	const db = {
		LEGACY_CACHE_TTL_MS,
		query(sql: string, params?: any[]) {
			return stubs.query ? stubs.query(...args(sql, params)) : fallbackDb.query(sql, params);
		},
		cachedQuery(sql: string, params: any[] | undefined, options: { ttlMs: number }) {
			if (!options || options.ttlMs !== LEGACY_CACHE_TTL_MS) {
				throw new Error(`cachedQuery 应使用旧 mysql_cache 的 ${LEGACY_CACHE_TTL_MS}ms 缓存，实际 options=${JSON.stringify(options)}：${sql}`);
			}
			return stubs.cachedQuery ? stubs.cachedQuery(...args(sql, params)) : fallbackDb.cachedQuery(sql, params, options);
		},
		tx(fn: any) {
			return fallbackDb.tx(fn);
		}
	};
	return Object.assign({ default: db }, db);
}
