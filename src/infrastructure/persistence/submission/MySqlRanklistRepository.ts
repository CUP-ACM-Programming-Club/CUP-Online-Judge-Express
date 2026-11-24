import { cachedQuery, LEGACY_CACHE_TTL_MS } from "../../db";
import { MemberFilter, RanklistRepository, TimeRankKind } from "../../../application/ports/RanklistRepository";

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

const TIME_RANK: Record<TimeRankKind, { table: string, solvedExpr: string }> = {
    local: {
        table: "solution",
        solvedExpr: "COUNT(DISTINCT problem_id)"
    },
    vjudge: {
        table: "vjudge_solution",
        solvedExpr: "COUNT(DISTINCT CAST(CONCAT(oj_name, problem_id) AS BINARY))"
    }
};

function generateMemberSql(opt: any = {}) {
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

/** 排行榜 SQL（自 application/services/RanklistService 原样搬来）。 */
export class MySqlRanklistRepository implements RanklistRepository {
    findOverallPage(vjudge: boolean, opt: MemberFilter | any, page: number, pageCnt: number) {
        if (vjudge) {
            return cache_query(`SELECT user_id,nick,biography,vjudge_accept,vjudge_submit,avatar,avatarUrl,email FROM users where
                 ${generateMemberSql(opt)} school != 'your_own_school' ORDER BY vjudge_accept
                 DESC,vjudge_submit DESC,reg_time LIMIT ?,?`, [page, pageCnt]);
        } else {
            return cache_query(`SELECT user_id,biography,nick,solved,submit,vjudge_solved,avatar,avatarUrl,email FROM users where
                ${generateMemberSql(opt)} school != 'your_own_school' ORDER BY solved 
                    DESC,submit,reg_time LIMIT ?,?`, [page, pageCnt]);
        }
    }

    searchPage(vjudge: boolean, search_name: string, page: number, pageCnt: number) {
        if (vjudge) {
            return cache_query(`SELECT user_id,nick,biography,vjudge_submit,vjudge_accept,avatar,avatarUrl,email FROM users WHERE user_id
            LIKE ? OR nick LIKE ? ORDER BY solved DESC,submit,user_id
            LIMIT ?,?`,
                [search_name, search_name, page, pageCnt]);
        } else {
            return cache_query(`SELECT user_id,nick,biography,solved,vjudge_solved,submit,avatar,avatarUrl,email FROM users WHERE user_id
            LIKE ? OR nick LIKE ? ORDER BY solved DESC,submit,user_id
            LIMIT ?,?`,
                [search_name, search_name, page, pageCnt]);
        }
    }

    findTimeRankPage(kind: TimeRankKind, time_start: string, offset: number, pageCnt: number) {
        const { table, solvedExpr } = TIME_RANK[kind];
        return cache_query(timeRankSql(table, solvedExpr, true),
            [RESERVED_KEYS, ARRAY_INDEX_REGEXP, time_start, offset, pageCnt]);
    }

    findTimeRankAll(kind: TimeRankKind, time_start: string) {
        const { table, solvedExpr } = TIME_RANK[kind];
        return cache_query(timeRankSql(table, solvedExpr, false),
            [RESERVED_KEYS, ARRAY_INDEX_REGEXP, time_start]);
    }

    probeAnyAccepted(kind: TimeRankKind, time_start: string) {
        const { table } = TIME_RANK[kind];
        return cache_query(`SELECT 1 AS any_ac FROM ${table} WHERE in_date >= ? AND result = 4 LIMIT 1`, [time_start]);
    }

    findUsersByIds(userIds: any[]) {
        return cache_query(`SELECT user_id, nick, biography, email, avatar, avatarUrl 
                        FROM users WHERE user_id IN (?)`, [userIds]);
    }

    countVjudgeSubmits(time_start: string, userIds: any[]) {
        return cache_query(`SELECT MIN(user_id) AS user_id, COUNT(*) AS submit
                        FROM vjudge_solution
                        WHERE in_date >= ? AND user_id IN (?)
                        GROUP BY CAST(user_id AS BINARY)`, [time_start, userIds]);
    }

    countUsers() {
        return cache_query("SELECT count(1) as tot_user FROM users where school != 'your_own_school'");
    }

    countAcmMembers() {
        return cache_query("SELECT count(1) as acm_user FROM acm_member");
    }
}
