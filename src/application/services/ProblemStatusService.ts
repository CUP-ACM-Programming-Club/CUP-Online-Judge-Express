import { submissionProblemStatusRepository as repository } from "../ports/SubmissionProblemStatusRepository";
import { getLogger } from "../ports/Logger";
const logger = getLogger("cheese", "info");

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
    private async getMergedStats(problemId: number, userId: string, source: boolean, ojFrom: string = "") {
        return await repository.findMergedStats(problemId, userId, source, ojFrom);
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
            // 合并后的查询：5个并发请求
            const [mergedStats, solutions, end_contest, problem_limit] = await Promise.all([
                this.getMergedStats(problemId, userId, source, ojFrom),
                repository.findAcceptedSolutions(problemId, source, ojFrom, page * page_cnt, page_cnt),
                repository.findContestEndTime(problemId),
                repository.findProblemLimit(problemId)
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
            const cached = await repository.getCachedStatus(cacheKey);
            if (cached) {
                logger.debug(`ProblemStatus cache hit for problem ${problemId}`);
                const cachedData = JSON.parse(cached);

                // 更新用户个人数据（user_passed）
                const userPassed = await repository.findUserPassed(problemId, userId, source);

                cachedData.stats.user_passed = userPassed[0]?.passed || 0;
                return cachedData;
            }

            logger.debug(`ProblemStatus cache miss for problem ${problemId}`);
            const result = await this.getProblemStatusOptimized(
                problemId, userId, page, page_cnt, source, ojFrom
            );

            // 缓存 30 分钟（题目统计变化慢）
            await repository.setCachedStatus(cacheKey, 1800, JSON.stringify(result));

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

        const [_time_range, _memory_range] = await Promise.all([
            repository.findTimeDistribution(problemId, time_limit, time_step),
            repository.findMemoryDistribution(problemId, memory_limit, memory_step)
        ]);
        return { time_range: _time_range, memory_range: _memory_range };
    }

    /**
     * 清除特定题目的缓存
     */
    async clearProblemStatusCache(problemId: number): Promise<void> {
        const keys = this.generateProblemStatusClearKeys(problemId);
        await repository.clearCachedStatus(keys, `ProblemStatus for problem ${problemId}`);
    }
}

export default new ProblemStatusService();
