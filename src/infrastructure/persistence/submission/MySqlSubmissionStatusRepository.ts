import { cachedQuery, LEGACY_CACHE_TTL_MS } from "../../db";
import { StatusListScope, StatusQueryOptions, SubmissionStatusRepository } from "../../../application/ports/SubmissionStatusRepository";

/** 与原 mysql_cache 相同的 2s 读缓存 */
const CACHE = { ttlMs: LEGACY_CACHE_TTL_MS };
const cache_query = (sql: string, params?: any[]) => cachedQuery<any[]>(sql, params, CACHE);

/** 原逐行查询（user_id = ?，按 MySQL 排序规则比较），批量结果对不上时用它兜底 */
const USER_INFO_SQL = "SELECT nick,avatar,avatarUrl,email FROM users WHERE user_id = ?";
const USER_INFO_BATCH_SQL = "SELECT user_id,nick,avatar,avatarUrl,email FROM users WHERE user_id IN (?)";

const compareSymbol = ["!=", "=", "<=", ">=", ">", "<"];

function isCompareFlag(flag: any) {
    return flag >= 0 && flag <= 5;
}

/** 把筛选条件转成 where 子句片段与参数（自 StatusService.generateSqlData 原样搬来） */
function generateSqlData(request_query: any) {
    let where_sql: string[] = [], sql_arr: any[] = [];
    for (let key in request_query) {
        if (!Object.prototype.hasOwnProperty.call(request_query, key)) {
            continue;
        }
        if (key === "limit" || key === "sim") {
            continue;
        }
        const value = request_query[key];
        if (typeof value === "undefined" || typeof value === "boolean") {
            continue;
        }

        if (typeof value === "string" || typeof value === "number") {
            where_sql.push(` ${key} = ?`);
            sql_arr.push(value);
        } else if (typeof value === "object") {
            const ele = value;
            if (Array.isArray(ele)) {
                for (let val of ele) {
                    if (typeof val === "undefined" || val === null) {
                        continue;
                    }
                    if (typeof val === "string" || typeof val === "number") {
                        where_sql.push(` ${key} = ?`);
                        sql_arr.push(val);
                    } else if (val && isCompareFlag(val.type)) {
                        where_sql.push(` ${key} ${compareSymbol[val.type]} ?`);
                        sql_arr.push(val.value);
                    }
                }
            } else {
                if (ele && isCompareFlag(ele.type)) {
                    where_sql.push(` ${key} ${compareSymbol[ele.type]} ?`);
                    sql_arr.push(ele.value);
                }
            }
        }
    }
    return { where_sql, sql_arr };
}

/** 状态页 SQL（自 application/services/StatusService 原样搬来）。 */
export class MySqlSubmissionStatusRepository implements SubmissionStatusRepository {
    async findStatusPage(scope: StatusListScope, request_query: StatusQueryOptions, limit: number, viewerId?: string): Promise<any[]> {
        let { where_sql, sql_arr } = generateSqlData(request_query);
        let pre_sim = "", end_sim = "";

        if (request_query.sim) {
            if (request_query.user_id) {
                // sim 按用户筛选时 user_id 额外用于 sim 表子查询（s_user_id）
                const user_id_sql = " where s_user_id = ?";
                sql_arr.push(request_query.user_id);
                where_sql.push(` solution_id in (select s_id as solution_id from sim${user_id_sql})`);
            } else {
                pre_sim = "select * from(";
                end_sim = ")t where sim is not null";
            }
        }

        let where_clause = "";

        if (scope === "privileged") {
            if (where_sql.length > 0) {
                where_clause = ` where ${where_sql.join(" and ").trim()}`;
            }

            sql_arr.push(limit);

            let common_fields = "fingerprint,fingerprintRaw,solution_id,pass_rate,ip,contest_id,num,problem_id,user_id,time,memory,in_date,result,language,code_length,judger, \"local\" as oj_name";
            if (!request_query.contest_id) {
                common_fields = common_fields.replace("pass_rate,ip", "pass_rate,share,ip");
            }

            const orderBy = request_query.contest_id ? "order by sol.in_date desc,sol.solution_id desc" : "order by sol.solution_id desc";

            return await cache_query(`${pre_sim}select * from
                                (select ${common_fields}
                                from solution ${where_clause}) sol
                                left join sim on sim.s_id = sol.solution_id
                                ${orderBy}${end_sim} limit ?,20`, sql_arr);

        } else if (scope === "contest") {
            where_sql.unshift("problem_id > 0");
            where_clause = ` where ${where_sql.join(" and ").trim()}`;

            sql_arr.push(limit);

            return await cache_query(`${pre_sim}select * from
                                (select fingerprint,fingerprintRaw,solution_id,contest_id,ip,num,problem_id,user_id,time,memory,in_date,result,language,code_length,judger, "local" as oj_name 
                                from solution ${where_clause}) sol
                                left join sim on sim.s_id = sol.solution_id
                                order by sol.in_date desc, sol.solution_id desc${end_sim} limit ?,20`, sql_arr);
        } else {
            where_sql.unshift("problem_id > 0");
            where_sql.unshift("contest_id is null");
            // 隐藏题（problem.defunct = 'Y'）的题库提交不对普通用户公开，避免从题号看出考前备题；
            // 自己的提交照常可见
            const hiddenProblem = "exists (select 1 from problem hp where hp.problem_id = solution.problem_id and hp.defunct = 'Y')";
            if (viewerId) {
                where_sql.push(` (user_id = ? or not ${hiddenProblem})`);
                sql_arr.push(viewerId);
            } else {
                where_sql.push(` not ${hiddenProblem}`);
            }
            where_clause = ` where ${where_sql.join(" and ").trim()}`;

            sql_arr.push(limit);

            const share_check = `if((share = 1 and not exists (select * from contest where contest_id in
           (select contest_id from contest_problem where solution.problem_id = contest_problem.problem_id)
          and end_time > NOW()) ),1,0) as share`;

            return await cache_query(`${pre_sim}select * from
                                (select fingerprint,fingerprintRaw,solution_id,
                                ${share_check}
                                ,pass_rate,problem_id,ip,contest_id,num,user_id,time,
                                memory,in_date,result,language,code_length,judger, "local" as oj_name from solution
                                ${where_clause}) sol
                                left join sim on sim.s_id = sol.solution_id
                                order by sol.in_date desc,sol.solution_id desc${end_sim} limit ?,20`, sql_arr);
        }
    }

    findContestEnded(contestId: number) {
        return cache_query("select count(1),end_time as cnt from contest where end_time<NOW() and contest_id = ?", [contestId]);
    }

    findUsersByIds(userIds: any[]) {
        return cache_query(USER_INFO_BATCH_SQL, [userIds]);
    }

    findUserInfo(userId: any) {
        return cache_query(USER_INFO_SQL, [userId]);
    }

    findContest(contestId: number) {
        return cache_query("SELECT * FROM contest WHERE contest_id = ?", [contestId]);
    }
}
