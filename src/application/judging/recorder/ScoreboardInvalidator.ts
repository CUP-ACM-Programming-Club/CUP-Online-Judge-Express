import { MySQLManager } from "../../../infrastructure/db/mysql/MySQLManager";
import ScoreboardService from "../../services/ScoreboardService";

const log4js = require("../../../infrastructure/logging/logger");
const logger = log4js.logger("cheese", "info");

export interface ScoreboardInvalidatorDeps {
    lookupContestId: (solutionId: number | string) => Promise<number | null>;
    clearScoreboardCache: (contestId: number) => Promise<void>;
    logError: (message: string, err: any) => void;
    /** 延迟二次清除的间隔（毫秒），<=0 表示不做二次清除 */
    trailingDelayMs: number;
}

async function defaultLookupContestId(solutionId: number | string): Promise<number | null> {
    const rows: any[] = await MySQLManager.execQuery("select contest_id from solution where solution_id = ?", [solutionId]);
    if (!rows || rows.length === 0) {
        return null;
    }
    const cid = parseInt(rows[0].contest_id);
    return isNaN(cid) || cid <= 0 ? null : cid;
}

/**
 * 判题结果落库后清除对应比赛的榜单 Redis 缓存。
 *
 * - fire-and-forget：调用方不 await，任何错误（MySQL/Redis）只记日志，不影响判题结果存储；
 * - 榜单底层查询走 mysql_cache（约 2 秒进程内缓存），失效后紧接着的重建可能拿到 2 秒内的旧数据
 *   并重新写入 Redis 180 秒，因此在 trailingDelayMs 后再清一次（同一比赛合并为一次）；
 * - 原有 180 秒 TTL 保留作为兜底。
 */
export class ScoreboardInvalidator {
    private pendingTrailing: Map<number, ReturnType<typeof setTimeout>> = new Map();

    constructor(private deps: ScoreboardInvalidatorDeps) {}

    invalidateBySolution(solutionId: number | string): void {
        try {
            this.run(solutionId).catch(err => this.deps.logError("scoreboard invalidation failed", err));
        } catch (err) {
            this.deps.logError("scoreboard invalidation failed", err);
        }
    }

    private async run(solutionId: number | string) {
        const contestId = await this.deps.lookupContestId(solutionId);
        if (!contestId) {
            return;
        }
        await this.clear(contestId);
        this.scheduleTrailing(contestId);
    }

    private async clear(contestId: number) {
        try {
            await this.deps.clearScoreboardCache(contestId);
        } catch (err) {
            this.deps.logError(`clear scoreboard cache failed, contest ${contestId}`, err);
        }
    }

    private scheduleTrailing(contestId: number) {
        if (this.deps.trailingDelayMs <= 0 || this.pendingTrailing.has(contestId)) {
            return;
        }
        const timer = setTimeout(() => {
            this.pendingTrailing.delete(contestId);
            this.clear(contestId).catch(err => this.deps.logError("scoreboard trailing invalidation failed", err));
        }, this.deps.trailingDelayMs);
        if (timer && typeof (timer as any).unref === "function") {
            (timer as any).unref();
        }
        this.pendingTrailing.set(contestId, timer);
    }
}

export default new ScoreboardInvalidator({
    lookupContestId: defaultLookupContestId,
    clearScoreboardCache: (contestId: number) => ScoreboardService.clearScoreboardCache(contestId),
    logError: (message: string, err: any) => logger.error(message, err),
    trailingDelayMs: 3000
});
