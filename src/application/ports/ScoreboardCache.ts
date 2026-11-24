import { definePort } from "./registry";

export interface ScoreboardCacheOptions {
	key: string;
	/** 秒 */
	ttl: number;
	name?: string;
}

/** 榜单的共享缓存（Redis）。实现：infrastructure/cache/cache-helper */
export interface ScoreboardCache {
	withCache<T>(options: ScoreboardCacheOptions, fetchFn: () => Promise<T>): Promise<T>;
	clearCacheBatch(keys: string[], name?: string): Promise<void>;
}

export const scoreboardCache = definePort<ScoreboardCache>("ScoreboardCache");
