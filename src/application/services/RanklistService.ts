
import { ranklistRepository, TimeRankKind } from "../ports/RanklistRepository";
import dayjs from "dayjs";
import const_variable from "../../domain/constants/const_name";
import { error } from "../../domain/constants/state";
import { redactRows } from "../../domain/policy/privacy";

export interface RanklistViewer {
    /** 管理员可见原始 email */
    privileged: boolean;
    viewerId?: string | null;
}

interface RanklistOptions {
    page: number;
    search: string;
    time_stamp?: string;
    vjudge: boolean;
    acm_member?: boolean;
    retired_member?: boolean;
}

/**
 * 时间段排行（?time_stamp=D/W/M/Y/...）在 SQL 中按用户聚合，只取回当前页；
 * SQL 与口径说明见 infrastructure/persistence/submission/MySqlRanklistRepository。
 * 原实现遇到 Object.prototype 上的同名键会抛 TypeError，页码越界会触发 SQL 错误，两者接口都返回 error.database，这里保持一致。
 */
class RanklistService {
    private readonly PAGE_CNT = 50;

    async getRanklist(opt: RanklistOptions, viewer: RanklistViewer = { privileged: false }) {
        let page = opt.page * this.PAGE_CNT;
        let result;

        if (!opt.search && !opt.time_stamp) {
            result = await ranklistRepository.findOverallPage(!!opt.vjudge, opt, page, this.PAGE_CNT);
        } else if (!opt.search) {
            let time_start;
            if (opt.time_stamp === "Y") {
                time_start = dayjs().subtract(1, "year").format("YYYY-MM-DD");
            } else if (opt.time_stamp === "M") {
                time_start = dayjs().subtract(1, "month").format("YYYY-MM-DD");
            } else if (opt.time_stamp === "W") {
                time_start = dayjs().subtract(1, "week").format("YYYY-MM-DD");
            } else if (opt.time_stamp === "D") {
                time_start = dayjs().subtract(1, "day").format("YYYY-MM-DD");
            } else {
                time_start = "1970-01-01";
            }
            const kind: TimeRankKind = opt.vjudge ? "vjudge" : "local";
            const sortedUsers = await this.rankByTime(kind, time_start, page);
            if (sortedUsers === null) {
                result = [];
            } else if (!opt.vjudge) {
                const userIds = sortedUsers.map(u => u.user_id);
                const users = await ranklistRepository.findUsersByIds(userIds);

                const userMap = new Map();
                users.forEach((u: any) => userMap.set(u.user_id, u));

                result = sortedUsers.map((s) => {
                    const user = userMap.get(s.user_id);
                    return {
                        ...user,
                        solved: s.solved,
                    };
                });
            } else {
                const userIds = sortedUsers.map(u => u.user_id);
                const users = await ranklistRepository.findUsersByIds(userIds);

                const userMap = new Map();
                users.forEach((u: any) => userMap.set(u.user_id, u));

                // 按精确 user_id 计数（原实现以 JS 对象键累加 IN 查询返回的每一行）
                const submits = await ranklistRepository.countVjudgeSubmits(time_start, userIds);
                const submitStats = new Map<string, number>();
                submits.forEach((sub: any) => submitStats.set(sub.user_id, Number(sub.submit)));

                result = sortedUsers.map((s) => {
                    const user = userMap.get(s.user_id);
                    return {
                        ...user,
                        vjudge_accept: s.solved,
                        vjudge_submit: submitStats.get(s.user_id) || 0
                    };
                });
            }
        } else if (!opt.time_stamp) {
            let search_name = `%${opt.search}%`;
            result = await ranklistRepository.searchPage(!!opt.vjudge, search_name, page, this.PAGE_CNT);
        } else {
            throw error.invalidParams;
        }

        // 排行榜只把 email 用于 gravatar：非管理员（且非本人）去掉 email，统一附带 email_hash
        return {
            ranklist: redactRows(result, {
                privileged: !!viewer.privileged,
                viewerId: viewer.viewerId,
                fields: [],
                hashEmail: true
            }),
            _name: const_variable.language.cn.ranklist
        };
    }

    /**
     * 时间段内按用户统计并排序，返回第 page 条起的一页 {user_id, solved}；时间段内没有任何 AC 时返回 null。
     * 语义见 MySqlRanklistRepository 中 timeRankSql 的说明。
     */
    private async rankByTime(kind: TimeRankKind, time_start: string, page: number): Promise<{ user_id: string, solved: number }[] | null> {
        let pageRows: any[];
        let anyAc: boolean;
        let hasReservedKey: boolean;
        if (typeof page === "number" && Number.isFinite(page) && page >= 0 && page <= Number.MAX_SAFE_INTEGER) {
            // 常规页码：原实现 slice(page, page + 50) 等价于 LIMIT trunc(page), 50
            pageRows = await ranklistRepository.findTimeRankPage(kind, time_start, Math.trunc(page), this.PAGE_CNT);
            if (pageRows.length > 0) {
                anyAc = true;
                hasReservedKey = Boolean(Number(pageRows[0].has_reserved_key));
            } else {
                const probe = await ranklistRepository.probeAnyAccepted(kind, time_start);
                anyAc = probe.length > 0;
                hasReservedKey = false;
            }
        } else {
            // 非常规页码（NaN、负数、Infinity 等）：取全部排序结果后按原实现同样的 slice 取页
            const all = await ranklistRepository.findTimeRankAll(kind, time_start);
            anyAc = all.length > 0;
            hasReservedKey = anyAc && Boolean(Number(all[0].has_reserved_key));
            pageRows = all.slice(page, page + this.PAGE_CNT);
        }
        if (!anyAc) {
            return null;
        }
        if (hasReservedKey) {
            throw new TypeError("ranklist: user_id collides with an Object.prototype key (legacy behaviour)");
        }
        if (pageRows.length === 0) {
            throw new Error("ranklist: page out of range (legacy behaviour: IN () query error)");
        }
        return pageRows.map((row: any) => ({ user_id: row.user_id, solved: Number(row.solved) }));
    }

    async getUserCount() {
        let [result1, result2] = await Promise.all([
            ranklistRepository.countUsers(),
            ranklistRepository.countAcmMembers()
        ]);
        return [{
            tot_user: result1[0].tot_user,
            acm_user: result2[0].acm_user
        }];
    }
}

export default new RanklistService();
