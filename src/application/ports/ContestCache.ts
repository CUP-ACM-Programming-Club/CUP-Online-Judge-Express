import { definePort } from "./registry";
import { ICachePool } from "../../shared/cache/CachePool";

/**
 * 比赛相关数据的进程内缓存（比赛概要、比赛列表）。
 * 实现：infrastructure/cache/pools/ContestCachePool（同一个实例也被 ContestManager 的 @Cacheable 使用，
 * 所以这里 removeAll 会一并清掉列表缓存）。
 */
export const contestCache = definePort<ICachePool>("ContestCache");
