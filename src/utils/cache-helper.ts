/**
 * Redis 缓存助手工具
 * 提供统一的缓存读写模式，避免重复代码
 */

import client from "../module/redis";

import { logger as log4js } from "../module/logger";
const logger = log4js("cheese", "info");

/**
 * 缓存配置选项
 */
export interface CacheOptions {
    /** 缓存键 */
    key: string;
    /** TTL（秒） */
    ttl: number;
    /** 缓存名称（用于日志） */
    name?: string;
}

/**
 * 带缓存的数据获取
 * 
 * 使用示例：
 * ```typescript
 * const result = await withCache({
 *   key: 'user:123',
 *   ttl: 300,
 *   name: 'User Data'
 * }, async () => {
 *   return await fetchUserFromDB(123);
 * });
 * ```
 * 
 * @param options 缓存配置
 * @param fetchFn 数据获取函数
 * @returns 缓存或新获取的数据
 */
export async function withCache<T>(
    options: CacheOptions,
    fetchFn: () => Promise<T>
): Promise<T> {
    const { key, ttl, name = 'Data' } = options;

    try {
        // 1. 尝试从缓存读取
        const cached = await client.getAsync(key);
        if (cached) {
            logger.debug(`${name} cache hit: ${key}`);
            return JSON.parse(cached);
        }

        // 2. 缓存未命中，调用获取函数
        logger.debug(`${name} cache miss: ${key}, fetching data`);
        const result = await fetchFn();

        // 3. 写入缓存
        await client.setexAsync(key, ttl, JSON.stringify(result));

        return result;
    } catch (e) {
        logger.error(`${name} cache error for key ${key}:`, e);
        throw e;
    }
}

/**
 * 清除单个缓存键
 * 
 * @param key 缓存键
 * @param name 缓存名称（用于日志）
 */
export async function clearCache(key: string, name: string = 'Cache'): Promise<void> {
    try {
        await client.delAsync(key);
        logger.info(`Cleared ${name}: ${key}`);
    } catch (e) {
        logger.error(`Failed to clear ${name} ${key}:`, e);
    }
}

/**
 * 批量清除缓存键
 * 
 * @param keys 缓存键数组
 * @param name 缓存名称（用于日志）
 */
export async function clearCacheBatch(keys: string[], name: string = 'Cache'): Promise<void> {
    try {
        await Promise.all(keys.map(key => client.delAsync(key)));
        logger.info(`Cleared ${name} (${keys.length} keys)`);
    } catch (e) {
        logger.error(`Failed to clear ${name} batch:`, e);
    }
}

/**
 * 条件缓存：仅当数据满足条件时才缓存
 * 
 * @param options 缓存配置
 * @param fetchFn 数据获取函数
 * @param shouldCache 判断是否应该缓存的函数
 * @returns 数据
 */
export async function withConditionalCache<T>(
    options: CacheOptions,
    fetchFn: () => Promise<T>,
    shouldCache: (data: T) => boolean
): Promise<T> {
    const { key, ttl, name = 'Data' } = options;

    try {
        // 1. 尝试从缓存读取
        const cached = await client.getAsync(key);
        if (cached) {
            logger.debug(`${name} cache hit: ${key}`);
            return JSON.parse(cached);
        }

        // 2. 获取数据
        logger.debug(`${name} cache miss: ${key}`);
        const result = await fetchFn();

        // 3. 条件写入缓存
        if (shouldCache(result)) {
            await client.setexAsync(key, ttl, JSON.stringify(result));
            logger.debug(`${name} cached: ${key}`);
        } else {
            logger.debug(`${name} not cached (condition not met): ${key}`);
        }

        return result;
    } catch (e) {
        logger.error(`${name} conditional cache error:`, e);
        throw e;
    }
}
