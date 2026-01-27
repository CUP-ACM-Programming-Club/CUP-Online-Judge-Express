import client from "../module/redis";
import { withCache, clearCacheBatch } from "../utils/cache-helper";
import { MySQLManager } from "../manager/mysql/MySQLManager";
import cache_query = require("../module/mysql_cache");
const log4js = require("../module/logger");
const logger = log4js.logger("cheese", "info");

class ScoreboardService {
    /**
     * 生成缓存�?
     */
    private generateCacheKey(cid: number, browserPrivilege: boolean): string {
        return `scoreboard:${cid}:${browserPrivilege ? 'admin' : 'user'}`;
    }

    /**
     * 生成清除缓存的键列表
     */
    private generateClearCacheKeys(cid: number): string[] {
        return [
            `scoreboard:${cid}:admin`,
            `scoreboard:${cid}:user`
        ];
    }

    private extractUserIds(submissions: any[]): string[] {
        return [...new Set(submissions.map((s: any) => s.user_id))];
    }

    private createUserMap(users: any[]): Record<string, any> {
        return Object.fromEntries(users.map((u: any) => [u.user_id, u]));
    }

    private extractSolutionIds(submissions: any[]): number[] {
        return submissions
            .filter((s: any) => s.fingerprint)
            .map((s: any) => s.solution_id);
    }

    private createSimMap(sims: any[]): Record<number, number> {
        return Object.fromEntries(sims.map((s: any) => [s.s_id, s.sim]));
    }

    private mergeSubmissionData(
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
     * 优化后的提交数据查询（两阶段查询�?
     */
    async submitHandlerOptimized(cid: number, browserPrivilege = false) {
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

            // 第二阶段：批量查询用户信息（去重�?
            const userIds = this.extractUserIds(submissions);
            const users = userIds.length > 0
                ? await cache_query(`
                SELECT user_id, nick, avatar, avatarUrl 
                FROM users 
                WHERE user_id IN (?)
              `, [userIds])
                : [];

            const userMap = this.createUserMap(users);

            // 第三阶段：批量查�?sim 数据（仅 solution 表）
            const solutionIds = this.extractSolutionIds(submissions);
            const sims = solutionIds.length > 0
                ? await cache_query(`
                SELECT s_id, sim FROM sim WHERE s_id IN (?)
              `, [solutionIds])
                : [];

            const simMap = this.createSimMap(sims);

            // 第四阶段：合并数�?
            return this.mergeSubmissionData(submissions, userMap, simMap);
        } catch (e) {
            logger.error('submitHandlerOptimized error:', e);
            throw e;
        }
    }

    private async contestUserHandler(cid: number) {
        const sql4 = `select t.*,users.nick from (select user_id from privilege where rightstr = ?)t
left join users on users.user_id = t.user_id`;
        return cache_query(sql4, ["c" + cid]);
    }

    async getScoreboard(cid: number, browserPrivilege = false) {
        const cacheKey = this.generateCacheKey(cid, browserPrivilege);

        return withCache(
            { key: cacheKey, ttl: 180, name: 'Scoreboard' },
            async () => {
                const sql2 = "select count(distinct num)total_problem from contest_problem where contest_id = ?";
                const sql3 = "select start_time,title,show_all_ranklist from contest where contest_id = ?";

                const _data = this.submitHandlerOptimized(cid, browserPrivilege);
                const _total = cache_query(sql2, [cid]);
                const _start_time = cache_query(sql3, [cid]);
                const _user = this.contestUserHandler(cid);

                const result = await Promise.all([_data, _total, _start_time, _user]);

                if (result[2].length === 0) {
                    throw new Error("no such contest");
                } else {
                    return {
                        status: "OK",
                        data: result[0],
                        total: result[1][0].total_problem,
                        start_time: result[2][0].start_time,
                        title: result[2][0].title,
                        show_all_ranklist: result[2][0].show_all_ranklist,
                        users: result[3]
                    };
                }
            }
        );
    }

    async getLineBreakInfo(cid: number) {
        const sql = `select code_stat.solution_id,
       code_stat.line,
       user.user_id, user.problem_id
from (select solution_id,
             length(source) - length(replace(source, '\n', '')) as line,
             source
      from source_code_user
      where solution_id in
            (select solution_id
             from solution
             where contest_id = ?
               and num >= 0
               and problem_id > 0)) code_stat
         left join
         (select user_id, solution_id, problem_id from solution where contest_id = ?) user
         on user.solution_id = code_stat.solution_id`;
        return await cache_query(sql, [cid, cid]);
    }

    async clearScoreboardCache(cid: number) {
        const keys = this.generateClearCacheKeys(cid);
        await clearCacheBatch(keys, `Scoreboard for contest ${cid}`);
    }
}

export default new ScoreboardService();
