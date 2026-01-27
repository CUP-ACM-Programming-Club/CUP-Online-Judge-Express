import client from "../module/redis";
import { withCache, clearCacheBatch } from "../utils/cache-helper";
import cache_query = require("../module/mysql_cache");
const log4js = require("../module/logger");
const logger = log4js.logger("cheese", "info");

class ProblemStatusService {

    /**
     * 生成缓存键（纯函数）
     */
    private generateProblemStatusCacheKey(problemId: number, source: boolean, ojFrom: string, page: number): string {
        return `problemstatus:${problemId}:${source ? 'local' : ojFrom}:${page}`;
    }

    /**
     * 生成清除缓存的键列表（纯函数）
     */
    private generateProblemStatusClearKeys(problemId: number, maxPages: number = 10): string[] {
        const keys = [];
        for (let page = 0; page < maxPages; page++) {
            keys.push(`problemstatus:${problemId}:local:${page}`);
        }
        return keys;
    }

    /**
     * 从合并结果中提取各项指标（纯函数，可导出测试）
     */
    private extractStats(stats: any[]) {
        if (stats.length === 0) {
            return {
                total_submit: 0,
                total_solved_submit: 0,
                total_solved_user: 0,
                user_passed: 0,
                problem_status: []
            };
        }

        const result4 = stats.find((s: any) => s.result === 4);

        return {
            total_submit: stats[0]?.total_all || 0,
            total_solved_submit: stats[0]?.total_distinct_users || 0,
            total_solved_user: result4?.distinct_users || 0,
            user_passed: result4?.user_submit_count || 0,
            problem_status: stats.map((s: any) => ({
                result: s.result,
                total: s.count
            }))
        };
    }

    /**
     * 合并统计查询（将 4 个独立查询合并为 1 个）
     */
    private async getMergedStats(problemId: number, userId: string, from: string, ojFrom: string = "") {
        const hasOJName = ojFrom ? "and oj_name = ?" : "";

        const sql = `
        SELECT 
            result,
            COUNT(*) as count,
            COUNT(DISTINCT user_id) as distinct_users,
            SUM(CASE WHEN user_id = ? THEN 1 ELSE 0 END) as user_submit_count,
            (SELECT COUNT(1) FROM ${from} WHERE problem_id = ? ${hasOJName}) as total_all,
            (SELECT COUNT(DISTINCT user_id) FROM ${from} WHERE problem_id = ? ${hasOJName}) as total_distinct_users
        FROM ${from}
        WHERE problem_id = ? ${hasOJName}
        GROUP BY result
    `;

        const finalParams = ojFrom
            ? [userId, problemId, ojFrom, problemId, ojFrom, problemId, ojFrom]
            : [userId, problemId, problemId, problemId];

        return await cache_query(sql, finalParams);
    }

    /**
     * 优化后的题目状态查询
     */
    async getProblemStatusOptimized(
        problemId: number,
        userId: string,
        page: number = 0,
        page_cnt: number = 20,
        source: boolean = true,
        ojFrom: string = ""
    ) {
        try {
            const from = source ? "solution" : "vjudge_solution";
            const hasOJName = ojFrom ? "and oj_name = ?" : "";

            // 合并后的查询：5个并发请求
            const [mergedStats, solutions, end_contest, problem_limit] = await Promise.all([
                this.getMergedStats(problemId, userId, from, ojFrom),

                cache_query(`
                select user_id,solution_id,language,code_length,in_date,time,memory 
                from ${from}
                where problem_id = ? and result = 4 ${hasOJName}
                order by time,memory,code_length,in_date,solution_id limit ?,?
            `, ojFrom
                    ? [problemId, ojFrom, page * page_cnt, page_cnt]
                    : [problemId, page * page_cnt, page_cnt]
                ),

                cache_query(`
                select max(end_time) as end_time from contest 
                where contest_id in (
                    select contest_id from contest_problem where problem_id = ?
                )
            `, [problemId]),

                cache_query(`
                select time_limit, memory_limit from problem where problem_id = ?
            `, [problemId])
            ]);

            const stats = this.extractStats(mergedStats);

            return {
                stats,
                solutions,
                end_contest,
                problem_limit: problem_limit[0]
            };
        } catch (e) {
            logger.error('getProblemStatusOptimized error:', e);
            throw e;
        }
    }

    /**
     * 带 Redis 缓存的题目状态查询
     */
    async getProblemStatusWithCache(
        problemId: number,
        userId: string,
        page: number = 0,
        page_cnt: number = 20,
        source: boolean = true,
        ojFrom: string = ""
    ) {
        // 用户个人数据不缓存，只缓存公开统计
        const cacheKey = this.generateProblemStatusCacheKey(problemId, source, ojFrom, page);

        try {
            const cached = await client.getAsync(cacheKey);
            if (cached) {
                logger.debug(`ProblemStatus cache hit for problem ${problemId}`);
                const cachedData = JSON.parse(cached);

                // 更新用户个人数据（user_passed）
                const from = source ? "solution" : "vjudge_solution";
                const userPassed = await cache_query(`
                select count(1) as passed from ${from}
                where problem_id = ? and user_id = ? and result = 4
            `, [problemId, userId]);

                cachedData.stats.user_passed = userPassed[0]?.passed || 0;
                return cachedData;
            }

            logger.debug(`ProblemStatus cache miss for problem ${problemId}`);
            const result = await this.getProblemStatusOptimized(
                problemId, userId, page, page_cnt, source, ojFrom
            );

            // 缓存 30 分钟（题目统计变化慢）
            await client.setexAsync(cacheKey, 1800, JSON.stringify(result));

            return result;
        } catch (e) {
            logger.error('getProblemStatusWithCache error:', e);
            throw e;
        }
    }

    /**
     * 查询时间/内存分布
     */
    async getProblemDistribution(problemId: number, problem_limit: any) {
        const time_limit = Math.max(1, problem_limit.time_limit * 1000);
        const memory_limit = Math.max(32, problem_limit.memory_limit * 1024);
        const time_step = parseFloat(String(time_limit)) * 2 / 25;
        const memory_step = parseFloat(String(memory_limit)) * 2 / 25;

        let sql1 = `select count(1)total,language,diff from (select case`;
        for (let i = 0; i <= time_limit; i += time_step) {
            sql1 += ` when time between ${parseInt(String(i))} and ${parseInt(String(i + time_step))} then '${parseInt(String(i))}-${parseInt(String(i + time_step))}' `;
        }
        sql1 += `else '>${time_limit}' end as diff ,language from solution where problem_id = ? and result = 4)t group by diff,language`;

        let sql2 = `select count(1)total,language,diff from (select case`;
        for (let i = 0; i <= memory_limit; i += memory_step) {
            sql2 += ` when memory between ${parseInt(String(i))} and ${parseInt(String(i + memory_step))} then '${parseInt(String(i))}-${parseInt(String(i + memory_step))}' `;
        }
        sql2 += `else '>${memory_limit}' end as diff,language from solution where problem_id = ? and result = 4)t group by diff,language`;

        const [_time_range, _memory_range] = await Promise.all([
            cache_query(sql1, [problemId]),
            cache_query(sql2, [problemId])
        ]);
        return { time_range: _time_range, memory_range: _memory_range };
    }

    /**
     * 清除特定题目的缓存
     */
    async clearProblemStatusCache(problemId: number): Promise<void> {
        const keys = this.generateProblemStatusClearKeys(problemId);
        await clearCacheBatch(keys, `ProblemStatus for problem ${problemId}`);
    }
}

export default new ProblemStatusService();
