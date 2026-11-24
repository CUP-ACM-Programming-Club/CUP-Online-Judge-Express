import { definePort } from "./registry";

/** 查询结果缓存的管理（后台「清缓存」）。实现：infrastructure/cache/MySQLCacheManager */
export interface QueryCache {
	removeCache(key: string): unknown;
	removeAllCache(): unknown;
	getCacheKey(): any[];
}

export const queryCache = definePort<QueryCache>("QueryCache");
