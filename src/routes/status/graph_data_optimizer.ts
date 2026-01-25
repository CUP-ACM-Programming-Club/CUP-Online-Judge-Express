/**
 * 图表数据查询优化模块
 * 使用 SQL 优化 + Redis 缓存来提升性能
 */

import client from "../../module/redis";
import { withCache, clearCacheBatch } from "../../utils/cache-helper";

const cache_query = require("../../module/mysql_cache");
const log4js = require("../../module/logger");
const logger = log4js.logger("cheese", "info");

// 时间粒度常量
export const TIME_GRANULARITY = {
    MONTH: 'month',
    DAY: 'day',
    HOUR: 'hour',
    MINUTE: 'minute',
    SECOND: 'second'
};

/**
 * 构建优化后的图表数据 SQL
 * @param granularity 时间粒度
 * @returns SQL 查询字符串
 */
function buildOptimizedGraphSQL(granularity: string): string {
    let timeFields = '';
    let groupBy = '';

    switch (granularity) {
        case TIME_GRANULARITY.MONTH:
            timeFields = 'YEAR(in_date) as year, MONTH(in_date) as month';
            groupBy = 'YEAR(in_date), MONTH(in_date)';
            break;
        case TIME_GRANULARITY.DAY:
            timeFields = 'YEAR(in_date) as year, MONTH(in_date) as month, DATE_FORMAT(in_date, "%d") as day';
            groupBy = 'YEAR(in_date), MONTH(in_date), DATE_FORMAT(in_date, "%d")';
            break;
        case TIME_GRANULARITY.HOUR:
            timeFields = 'YEAR(in_date) as year, MONTH(in_date) as month, DATE_FORMAT(in_date, "%d") as day, HOUR(in_date) as hour';
            groupBy = 'YEAR(in_date), MONTH(in_date), DATE_FORMAT(in_date, "%d"), HOUR(in_date)';
            break;
        case TIME_GRANULARITY.MINUTE:
            timeFields = 'HOUR(in_date) as hour, MINUTE(in_date) as minute';
            groupBy = 'HOUR(in_date), MINUTE(in_date)';
            break;
        case TIME_GRANULARITY.SECOND:
            timeFields = 'MINUTE(in_date) as minute, SECOND(in_date) as second';
            groupBy = 'MINUTE(in_date), SECOND(in_date)';
            break;
        default:
            timeFields = 'YEAR(in_date) as year, MONTH(in_date) as month';
            groupBy = 'YEAR(in_date), MONTH(in_date)';
    }

    // 优化后的 SQL：合并 UNION ALL，使用 SUM(CASE WHEN) 替代 LEFT JOIN
    return `
		SELECT 
			${timeFields},
			COUNT(*) as submit,
			SUM(CASE WHEN result = 4 THEN 1 ELSE 0 END) as accepted
		FROM (
			SELECT in_date, result FROM solution WHERE contest_id = ?
			UNION ALL
			SELECT in_date, result FROM vjudge_solution WHERE contest_id = ?
		) combined
		GROUP BY ${groupBy}
		ORDER BY ${groupBy}
	`;
}

/**
 * 从数据库获取优化后的图表数据 (无缓存逻辑)
 * @param contestId 比赛ID (可选, 0 表示全局统计)
 * @param granularity 时间粒度
 * @returns 图表数据
 */
async function getOptimizedGraphData(contestId: number, granularity: string): Promise<any[]> {
    let result: any[];

    if (contestId) {
        // 特定比赛的统计
        const sql = buildOptimizedGraphSQL(granularity);
        result = await cache_query(sql, [contestId, contestId]);
    } else {
        // 全局统计 (无 contest_id 条件)
        // 对于全局统计，我们只统计 solution 表，因为 vjudge_solution 没有 contest_id = 0 的概念
        const timeFields = 'YEAR(in_date) as year, MONTH(in_date) as month'; // 默认粒度
        const groupBy = 'YEAR(in_date), MONTH(in_date)'; // 默认粒度

        // Note: For global stats, the granularity logic needs to be applied here as well
        // For simplicity, I'm keeping the default month granularity for global stats as in the original code.
        // If global stats also need to respect granularity, the buildOptimizedGraphSQL needs to be adapted
        // or a similar switch case needs to be implemented here.
        // For now, let's apply the granularity logic to global stats as well for consistency.
        let globalTimeFields = '';
        let globalGroupBy = '';

        switch (granularity) {
            case TIME_GRANULARITY.MONTH:
                globalTimeFields = 'YEAR(in_date) as year, MONTH(in_date) as month';
                globalGroupBy = 'YEAR(in_date), MONTH(in_date)';
                break;
            case TIME_GRANULARITY.DAY:
                globalTimeFields = 'YEAR(in_date) as year, MONTH(in_date) as month, DATE_FORMAT(in_date, "%d") as day';
                globalGroupBy = 'YEAR(in_date), MONTH(in_date), DATE_FORMAT(in_date, "%d")';
                break;
            case TIME_GRANULARITY.HOUR:
                globalTimeFields = 'YEAR(in_date) as year, MONTH(in_date) as month, DATE_FORMAT(in_date, "%d") as day, HOUR(in_date) as hour';
                globalGroupBy = 'YEAR(in_date), MONTH(in_date), DATE_FORMAT(in_date, "%d"), HOUR(in_date)';
                break;
            case TIME_GRANULARITY.MINUTE:
                globalTimeFields = 'HOUR(in_date) as hour, MINUTE(in_date) as minute';
                globalGroupBy = 'HOUR(in_date), MINUTE(in_date)';
                break;
            case TIME_GRANULARITY.SECOND:
                globalTimeFields = 'MINUTE(in_date) as minute, SECOND(in_date) as second';
                globalGroupBy = 'MINUTE(in_date), SECOND(in_date)';
                break;
            default:
                globalTimeFields = 'YEAR(in_date) as year, MONTH(in_date) as month';
                globalGroupBy = 'YEAR(in_date), MONTH(in_date)';
        }


        const sql = `
            SELECT 
                ${globalTimeFields},
                COUNT(*) as submit,
                SUM(CASE WHEN result = 4 THEN 1 ELSE 0 END) as accepted
            FROM solution
            GROUP BY ${globalGroupBy}
            ORDER BY ${globalGroupBy}
        `;
        result = await cache_query(sql);
    }
    return result;
}

/**
 * 生成缓存键
 */
function generateCacheKey(contestId: number, granularity: string): string {
    return contestId
        ? `graph:${contestId}:${granularity}`
        : `graph:global:${granularity}`;
}

/**
 * 带 Redis 缓存的图表数据查询
 * @param contestId 比赛ID (可选, 0 表示全局统计)
 * @param granularity 时间粒度
 * @returns 图表数据
 */
export async function getGraphDataWithCache(
    contestId: number,
    granularity: string
): Promise<any[]> {
    const cacheKey = generateCacheKey(contestId, granularity);

    return withCache(
        { key: cacheKey, ttl: 300, name: 'Graph Data' },
        () => getOptimizedGraphData(contestId, granularity)
    );
}

/**
 * 清除特定比赛的图表缓存
 * @param contestId 比赛ID
 */
export async function clearGraphDataCache(contestId: number): Promise<void> {
    const keys = Object.values(TIME_GRANULARITY).map(g =>
        generateCacheKey(contestId, g)
    );
    await clearCacheBatch(keys, `Graph Data for contest ${contestId}`);
}

/**
 * 将粒度映射到索引 (用于与现有代码兼容)
 */
export function indexToGranularity(idx: number): string {
    const map = [
        TIME_GRANULARITY.MONTH,  // 0
        TIME_GRANULARITY.DAY,    // 1
        TIME_GRANULARITY.HOUR,   // 2
        TIME_GRANULARITY.MINUTE, // 3
        TIME_GRANULARITY.SECOND  // 4
    ];
    return map[idx] || TIME_GRANULARITY.MONTH;
}
