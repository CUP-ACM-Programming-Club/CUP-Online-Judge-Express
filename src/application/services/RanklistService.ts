
import { cachedQuery, LEGACY_CACHE_TTL_MS } from "../../infrastructure/db";
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

/** 与原 mysql_cache 相同的 2s 读缓存 */
const CACHE = { ttlMs: LEGACY_CACHE_TTL_MS };
const cache_query = (sql: string, params?: any[]) => cachedQuery<any[]>(sql, params, CACHE);

/**
 * 时间段排行（?time_stamp=D/W/M/Y/...）在 SQL 中按用户聚合，只取回当前页。
 *
 * 结果与重构前「取回时间段内全部 AC 行、在 JS 中用对象 + Set 统计再稳定排序」的实现逐项一致：
 * - 统计口径不变：in_date >= 起点 AND result = 4，不排除比赛内提交、不看题目 defunct、不套 acm_member/school 条件；
 *   本地按 problem_id 去重，vjudge 按 CONCAT(oj_name, problem_id) 去重；
 * - 原实现以 JS 对象键（精确字符串）区分用户、以 Set（精确值）去重，所以这里按 CAST(... AS BINARY) 分组/去重，
 *   不使用列的不区分大小写排序规则；
 * - 并列时的先后：原实现先按 solved 降序做稳定排序，原始次序是 Object.keys 的次序——
 *   「数组下标形式」的键（0 或不以 0 开头、值不超过 2^32-2 的十进制整数串）按数值升序排在最前，
 *   其余键按首次出现的次序；首次出现次序这里用该用户本时间段内最小的 solution_id 表示
 *   （原查询无 ORDER BY，主键/结果索引扫描即 solution_id 序，in_date 索引扫描在 in_date 随 solution_id 单调时也相同）；
 * - 原实现遇到 Object.prototype 上的同名键（constructor、toString、__proto__ 等）会抛 TypeError，
 *   页码越界（时间段内有 AC 但本页为空）会执行 IN () 触发 SQL 错误，两者接口都返回 error.database，这里保持一致。
 */
const ARRAY_INDEX_REGEXP = "^(0|[1-9][0-9]{0,9})\\z";
const MAX_ARRAY_INDEX = 4294967294;
const RESERVED_KEYS = Object.getOwnPropertyNames(Object.prototype);

function timeRankSql(table: string, solvedExpr: string, withLimit: boolean) {
    return `SELECT user_id, solved, has_reserved_key FROM (
            SELECT user_id, solved, first_sid,
                   MAX(CAST(user_id AS BINARY) IN (?)) OVER () AS has_reserved_key,
                   CASE WHEN user_id REGEXP ? THEN
                       CASE WHEN CAST(user_id AS UNSIGNED) <= ${MAX_ARRAY_INDEX} THEN CAST(user_id AS UNSIGNED) END
                   END AS array_index
            FROM (
                SELECT MIN(user_id) AS user_id, ${solvedExpr} AS solved, MIN(solution_id) AS first_sid
                FROM ${table}
                WHERE in_date >= ? AND result = 4
                GROUP BY CAST(user_id AS BINARY)
            ) agg
        ) ranked
        ORDER BY solved DESC, array_index IS NULL, array_index, first_sid${withLimit ? `
        LIMIT ?, ?` : ""}`;
}

const TIME_RANK = {
    local: {
        table: "solution",
        solvedExpr: "COUNT(DISTINCT problem_id)"
    },
    vjudge: {
        table: "vjudge_solution",
        solvedExpr: "COUNT(DISTINCT CAST(CONCAT(oj_name, problem_id) AS BINARY))"
    }
};

class RanklistService {
    private readonly PAGE_CNT = 50;

    private generateMemberSql(opt: any = {}) {
        if (typeof opt !== "object") {
            return "";
        }
        else if (opt.acm_member === true) {
            return " user_id in (select user_id from acm_member where level = 1) and";
        }
        else if (opt.retired_member === true) {
            return " user_id in (select user_id from acm_member where level = 2) and";
        }
        else {
            return "";
        }
    }

    async getRanklist(opt: RanklistOptions, viewer: RanklistViewer = { privileged: false }) {
        let page = opt.page * this.PAGE_CNT;
        let result;

        if (!opt.search && !opt.time_stamp) {
            if (opt.vjudge) {
                result = await cache_query(`SELECT user_id,nick,biography,vjudge_accept,vjudge_submit,avatar,avatarUrl,email FROM users where
                 ${this.generateMemberSql(opt)} school != 'your_own_school' ORDER BY vjudge_accept
                 DESC,vjudge_submit DESC,reg_time LIMIT ?,?`, [page, this.PAGE_CNT]);
            } else {
                result = await cache_query(`SELECT user_id,biography,nick,solved,submit,vjudge_solved,avatar,avatarUrl,email FROM users where
                ${this.generateMemberSql(opt)} school != 'your_own_school' ORDER BY solved 
                    DESC,submit,reg_time LIMIT ?,?`, [page, this.PAGE_CNT]);
            }
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
            const kind = opt.vjudge ? TIME_RANK.vjudge : TIME_RANK.local;
            const sortedUsers = await this.rankByTime(kind.table, kind.solvedExpr, time_start, page);
            if (sortedUsers === null) {
                result = [];
            } else if (!opt.vjudge) {
                const userIds = sortedUsers.map(u => u.user_id);
                const users = await cache_query(`SELECT user_id, nick, biography, email, avatar, avatarUrl 
                        FROM users WHERE user_id IN (?)`, [userIds]);

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
                const users = await cache_query(`SELECT user_id, nick, biography, email, avatar, avatarUrl 
                        FROM users WHERE user_id IN (?)`, [userIds]);

                const userMap = new Map();
                users.forEach((u: any) => userMap.set(u.user_id, u));

                // 按精确 user_id 计数（原实现以 JS 对象键累加 IN 查询返回的每一行）
                const submits = await cache_query(`SELECT MIN(user_id) AS user_id, COUNT(*) AS submit
                        FROM vjudge_solution
                        WHERE in_date >= ? AND user_id IN (?)
                        GROUP BY CAST(user_id AS BINARY)`, [time_start, userIds]);
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
            if (opt.vjudge) {
                result = await cache_query(`SELECT user_id,nick,biography,vjudge_submit,vjudge_accept,avatar,avatarUrl,email FROM users WHERE user_id
            LIKE ? OR nick LIKE ? ORDER BY solved DESC,submit,user_id
            LIMIT ?,?`,
                    [search_name, search_name, page, this.PAGE_CNT]);
            } else {
                result = await cache_query(`SELECT user_id,nick,biography,solved,vjudge_solved,submit,avatar,avatarUrl,email FROM users WHERE user_id
            LIKE ? OR nick LIKE ? ORDER BY solved DESC,submit,user_id
            LIMIT ?,?`,
                    [search_name, search_name, page, this.PAGE_CNT]);
            }
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
     * 语义见文件顶部 timeRankSql 的说明。
     */
    private async rankByTime(table: string, solvedExpr: string, time_start: string, page: number): Promise<{ user_id: string, solved: number }[] | null> {
        let pageRows: any[];
        let anyAc: boolean;
        let hasReservedKey: boolean;
        if (typeof page === "number" && Number.isFinite(page) && page >= 0 && page <= Number.MAX_SAFE_INTEGER) {
            // 常规页码：原实现 slice(page, page + 50) 等价于 LIMIT trunc(page), 50
            pageRows = await cache_query(timeRankSql(table, solvedExpr, true),
                [RESERVED_KEYS, ARRAY_INDEX_REGEXP, time_start, Math.trunc(page), this.PAGE_CNT]);
            if (pageRows.length > 0) {
                anyAc = true;
                hasReservedKey = Boolean(Number(pageRows[0].has_reserved_key));
            } else {
                const probe = await cache_query(`SELECT 1 AS any_ac FROM ${table} WHERE in_date >= ? AND result = 4 LIMIT 1`, [time_start]);
                anyAc = probe.length > 0;
                hasReservedKey = false;
            }
        } else {
            // 非常规页码（NaN、负数、Infinity 等）：取全部排序结果后按原实现同样的 slice 取页
            const all = await cache_query(timeRankSql(table, solvedExpr, false),
                [RESERVED_KEYS, ARRAY_INDEX_REGEXP, time_start]);
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
            cache_query("SELECT count(1) as tot_user FROM users where school != 'your_own_school'"),
            cache_query("SELECT count(1) as acm_user FROM acm_member")
        ]);
        return [{
            tot_user: result1[0].tot_user,
            acm_user: result2[0].acm_user
        }];
    }
}

export default new RanklistService();
