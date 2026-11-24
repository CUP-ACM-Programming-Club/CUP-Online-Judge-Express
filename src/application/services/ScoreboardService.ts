import { scoreboardRepository } from "../ports/ScoreboardRepository";
import { scoreboardCache } from "../ports/ScoreboardCache";
import { redactRows, SUBMISSION_SENSITIVE_FIELDS } from "../../domain/policy/privacy";
import { getLogger } from "../ports/Logger";
const logger = getLogger("cheese", "info");

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
            const submissions = await scoreboardRepository.findContestSubmissions(cid, browserPrivilege);

            if (submissions.length === 0) {
                return [];
            }

            // 第二阶段：批量查询用户信息（去重�?
            const userIds = this.extractUserIds(submissions);
            const users = userIds.length > 0
                ? await scoreboardRepository.findUsersByIds(userIds)
                : [];

            const userMap = this.createUserMap(users);

            // 第三阶段：批量查�?sim 数据（仅 solution 表）
            const solutionIds = this.extractSolutionIds(submissions);
            const sims = solutionIds.length > 0
                ? await scoreboardRepository.findSimBySolutionIds(solutionIds)
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
        return scoreboardRepository.findContestUsers(cid);
    }

    async getScoreboard(cid: number, browserPrivilege = false) {
        const cacheKey = this.generateCacheKey(cid, browserPrivilege);

        return scoreboardCache.withCache(
            { key: cacheKey, ttl: 180, name: 'Scoreboard' },
            async () => {
                const _data = this.submitHandlerOptimized(cid, browserPrivilege);
                const _total = scoreboardRepository.countContestProblems(cid);
                const _start_time = scoreboardRepository.findContestHeader(cid);
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
        return await scoreboardRepository.findLineBreakInfo(cid);
    }

    /**
     * 按请求者去敏：非特权用户看不到他人提交的 ip / fingerprint / fingerprintRaw（本人的行保留）。
     * 返回新对象，不修改（可能来自缓存的）入参。
     */
    redactScoreboard<T extends { data?: any[] }>(scoreboard: T, privileged: boolean, viewerId?: string | null): T {
        if (!scoreboard || !Array.isArray(scoreboard.data)) {
            return scoreboard;
        }
        return Object.assign({}, scoreboard, {
            data: redactRows(scoreboard.data, { privileged, viewerId, fields: SUBMISSION_SENSITIVE_FIELDS })
        });
    }

    async clearScoreboardCache(cid: number) {
        const keys = this.generateClearCacheKeys(cid);
        await scoreboardCache.clearCacheBatch(keys, `Scoreboard for contest ${cid}`);
    }
}

export default new ScoreboardService();
