/**
 * Scoreboard 查询优化模块
 * 使用两阶段查询 + Redis 缓存替代重复的 LEFT JOIN
 */

import client from "../../module/redis";
import { withCache, clearCacheBatch } from "../../utils/cache-helper";

const cache_query = require("../../module/mysql_cache");
const log4js = require("../../module/logger");
const logger = log4js.logger("cheese", "info");

/**
 * 生成缓存键（纯函数）
 */
export function generateCacheKey(cid: number, browserPrivilege: boolean): string {
    return `scoreboard:${cid}:${browserPrivilege ? 'admin' : 'user'}`;
}

/**
 * 生成清除缓存的键列表（纯函数）
 */
export function generateClearCacheKeys(cid: number): string[] {
    return [
        `scoreboard:${cid}:admin`,
        `scoreboard:${cid}:user`
    ];
}

/**
 * 从提交数据中提取唯一的用户ID（纯函数）
 */
export function extractUserIds(submissions: any[]): string[] {
    return [...new Set(submissions.map((s: any) => s.user_id))];
}

/**
 * 创建用户ID到用户信息的映射（纯函数）
 */
export function createUserMap(users: any[]): Record<string, any> {
    return Object.fromEntries(users.map((u: any) => [u.user_id, u]));
}

/**
 * 从提交数据中提取有指纹的solution ID（纯函数）
 */
export function extractSolutionIds(submissions: any[]): number[] {
    return submissions
        .filter((s: any) => s.fingerprint)
        .map((s: any) => s.solution_id);
}

/**
 * 创建solution ID到sim数据的映射（纯函数）
 */
export function createSimMap(sims: any[]): Record<number, number> {
    return Object.fromEntries(sims.map((s: any) => [s.s_id, s.sim]));
}

/**
 * 合并提交、用户和sim数据（纯函数）
 */
export function mergeSubmissionData(
    submissions: any[],
    userMap: Record<string, any>,
    simMap: Record<number, number>
): any[] {
    return submissions.map((s: any) => ({
        solution_id: s.solution_id,
        user_id: s.user_id,
        nick: userMap[s.user_id]?.nick || null,
        avatar: userMap[s.user_id]?.avatar || null,
        avatarUrl: userMap[s.user_id]?.avatarUrl || null,
        result: s.result,
        num: s.num,
        in_date: s.in_date,
        fingerprint: s.fingerprint,
        fingerprintRaw: s.fingerprintRaw,
        ip: s.ip,
        problem_id: s.problem_id,
        sim: simMap[s.solution_id] || null,
        code_length: s.code_length
    }));
}

/**
 * 优化后的提交数据查询（两阶段查询）
 * @param cid 比赛ID
 * @param browserPrivilege 是否有浏览器权限
 * @returns 提交数据（包含用户信息和 sim 数据）
 */
export async function submitHandlerOptimized(cid: number, browserPrivilege = false) {
    try {
        // 第一阶段：查询提交核心数据（不包含用户信息）
        const submissions = await cache_query(`
            SELECT solution_id, user_id, result, num, in_date, 
                   fingerprint, fingerprintRaw, ip, problem_id, code_length
            FROM solution 
            WHERE contest_id = ? AND num >= 0 
            ${browserPrivilege ? "" : "AND problem_id > 0"}
            UNION ALL
            SELECT solution_id, user_id, result, num, in_date, 
                   '' as fingerprint, '' as fingerprintRaw, 
                   ip, problem_id, code_length
            FROM vjudge_solution 
            WHERE contest_id = ? AND num >= 0 AND problem_id > 0
            ORDER BY user_id, in_date
        `, [cid, cid]);

        if (submissions.length === 0) {
            return [];
        }

        // 第二阶段：批量查询用户信息（去重）
        const userIds = extractUserIds(submissions);
        const users = userIds.length > 0
            ? await cache_query(`
                SELECT user_id, nick, avatar, avatarUrl 
                FROM users 
                WHERE user_id IN (?)
              `, [userIds])
            : [];

        const userMap = createUserMap(users);

        // 第三阶段：批量查询 sim 数据（仅 solution 表）
        const solutionIds = extractSolutionIds(submissions);
        const sims = solutionIds.length > 0
            ? await cache_query(`
                SELECT s_id, sim FROM sim WHERE s_id IN (?)
              `, [solutionIds])
            : [];

        const simMap = createSimMap(sims);

        // 第四阶段：合并数据
        return mergeSubmissionData(submissions, userMap, simMap);
    } catch (e) {
        logger.error('submitHandlerOptimized error:', e);
        throw e;
    }
}

/**
 * 带 Redis 缓存的 scoreboard 查询
 * @param cid 比赛ID
 * @param browserPrivilege 是否有浏览器权限
 * @returns 提交数据
 */
export async function getScoreboardWithCache(cid: number, browserPrivilege = false) {
    const cacheKey = generateCacheKey(cid, browserPrivilege);

    return withCache(
        { key: cacheKey, ttl: 180, name: 'Scoreboard' },
        () => submitHandlerOptimized(cid, browserPrivilege)
    );
}

/**
 * 清除特定比赛的 scoreboard 缓存
 * @param cid 比赛ID
 */
export async function clearScoreboardCache(cid: number): Promise<void> {
    const keys = generateClearCacheKeys(cid);
    await clearCacheBatch(keys, `Scoreboard for contest ${cid}`);
}
