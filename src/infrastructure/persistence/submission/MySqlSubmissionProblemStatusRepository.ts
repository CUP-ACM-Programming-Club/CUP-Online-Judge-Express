import client from "../../redis/redis";
import { clearCacheBatch } from "../../cache/cache-helper";
import { SubmissionProblemStatusRepository } from "../../../application/ports/SubmissionProblemStatusRepository";

import { cachedQuery, LEGACY_CACHE_TTL_MS } from "../../db";

/** 与原 mysql_cache 相同的 2s 读缓存（本文件经它的 SQL 都不含 update/insert/delete 字样，旧外壳同样会缓存） */
const CACHE = { ttlMs: LEGACY_CACHE_TTL_MS };
const cache_query = (sql: string, params?: any[]) => cachedQuery<any>(sql, params, CACHE);

function tableOf(source: boolean) {
    return source ? "solution" : "vjudge_solution";
}

/** 题目提交统计 SQL 与 Redis 缓存（自 application/services/ProblemStatusService 原样搬来）。 */
export class MySqlSubmissionProblemStatusRepository implements SubmissionProblemStatusRepository {
    /**
     * 合并统计查询（将 4 个独立查询合并为 1 个）
     */
    async findMergedStats(problemId: number, userId: string, source: boolean, ojFrom: string = "") {
        const from = tableOf(source);
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

    findAcceptedSolutions(problemId: number, source: boolean, ojFrom: string, offset: number, page_cnt: number) {
        const from = tableOf(source);
        const hasOJName = ojFrom ? "and oj_name = ?" : "";
        return cache_query(`
                select user_id,solution_id,language,code_length,in_date,time,memory 
                from ${from}
                where problem_id = ? and result = 4 ${hasOJName}
                order by time,memory,code_length,in_date,solution_id limit ?,?
            `, ojFrom
            ? [problemId, ojFrom, offset, page_cnt]
            : [problemId, offset, page_cnt]
        );
    }

    findContestEndTime(problemId: number) {
        return cache_query(`
                select max(end_time) as end_time from contest 
                where contest_id in (
                    select contest_id from contest_problem where problem_id = ?
                )
            `, [problemId]);
    }

    findProblemLimit(problemId: number) {
        return cache_query(`
                select time_limit, memory_limit from problem where problem_id = ?
            `, [problemId]);
    }

    findUserPassed(problemId: number, userId: string, source: boolean) {
        const from = tableOf(source);
        return cache_query(`
                select count(1) as passed from ${from}
                where problem_id = ? and user_id = ? and result = 4
            `, [problemId, userId]);
    }

    findTimeDistribution(problemId: number, time_limit: number, time_step: number) {
        let sql1 = `select count(1)total,language,diff from (select case`;
        for (let i = 0; i <= time_limit; i += time_step) {
            sql1 += ` when time between ${parseInt(String(i))} and ${parseInt(String(i + time_step))} then '${parseInt(String(i))}-${parseInt(String(i + time_step))}' `;
        }
        sql1 += `else '>${time_limit}' end as diff ,language from solution where problem_id = ? and result = 4)t group by diff,language`;
        return cache_query(sql1, [problemId]);
    }

    findMemoryDistribution(problemId: number, memory_limit: number, memory_step: number) {
        let sql2 = `select count(1)total,language,diff from (select case`;
        for (let i = 0; i <= memory_limit; i += memory_step) {
            sql2 += ` when memory between ${parseInt(String(i))} and ${parseInt(String(i + memory_step))} then '${parseInt(String(i))}-${parseInt(String(i + memory_step))}' `;
        }
        sql2 += `else '>${memory_limit}' end as diff,language from solution where problem_id = ? and result = 4)t group by diff,language`;
        return cache_query(sql2, [problemId]);
    }

    getCachedStatus(cacheKey: string) {
        return client.getAsync(cacheKey);
    }

    setCachedStatus(cacheKey: string, seconds: number, value: string) {
        return client.setexAsync(cacheKey, seconds, value);
    }

    clearCachedStatus(cacheKeys: string[], name: string) {
        return clearCacheBatch(cacheKeys, name);
    }
}
