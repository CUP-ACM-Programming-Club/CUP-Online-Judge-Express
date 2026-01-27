import { JudgeResult } from "../enums/JudgeResult";
import ContestAssistantManager from "../manager/contest/ContestAssistantManager";
import { getGraphDataWithCache, getGraphLabel, TIME_GRANULARITY } from "../routes/status/graph_data_optimizer";

const cache_query = require("../module/mysql_cache");
const const_name = require("../module/const_name");

interface StatusQueryOptions {
    problem_id?: number | { type: number, value: number }[];
    user_id?: string;
    language?: number;
    result?: number;
    contest_id?: number;
    sim?: boolean;
    num?: number;
    limit?: number;
}

export class StatusService {

    private readonly NOT_EQUAL = 1;
    private readonly EQUAL = 0;
    private readonly LESS_OR_EQUAL = 2;
    private readonly GREATER_OR_EQUAL = 3;
    private readonly GREATER = 4;
    private readonly LESSER = 5;
    private readonly compareSymbol = ["!=", "=", "<=", ">=", ">", "<"];

    private isCompareFlag(flag: any) {
        return flag >= 0 && flag <= 5;
    }

    private generateSqlData(request_query: any) {
        let where_sql: string[] = [], sql_arr: any[] = [];
        for (let key in request_query) {
            if (!Object.prototype.hasOwnProperty.call(request_query, key)) {
                continue;
            }
            const value = request_query[key];
            const value = request_query[key];
            if (typeof value === "undefined" || typeof value === "boolean" || key === "limit" || key === "sim") {
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
                        } else if (val && this.isCompareFlag(val.type)) {
                            where_sql.push(` ${key} ${this.compareSymbol[val.type]} ?`);
                            sql_arr.push(val.value);
                        }
                    }
                } else {
                    if (ele && this.isCompareFlag(ele.type)) {
                        where_sql.push(` ${key} ${this.compareSymbol[ele.type]} ?`);
                        sql_arr.push(ele.value);
                    }
                }
            }
        }
        return { where_sql, sql_arr };
    }

    private check_owner(data: any, owner: boolean) {
        return owner ? data : "----";
    }

    private renameProperty(element: any, newProperty: string, oldProperty: string) {
        element[newProperty] = element[oldProperty];
        delete element[oldProperty];
    }

    private async buildResponse(req: any, val: any, request_query: any, browser_privilege: boolean, _end: boolean) {
        const _user_info = await cache_query("SELECT nick,avatar,avatarUrl,email FROM users WHERE user_id = ?", [val.user_id]);
        if (_user_info.length > 0) {
            const nick = _user_info[0].nick.trim();
            const avatar = Boolean(_user_info[0].avatar);
            const avatarUrl = _user_info[0].avatarUrl || "";
            const email = _user_info[0].email || "";
            let element = Object.assign({ nick, avatar, avatarUrl, email }, val);
            this.renameProperty(element, "sim_id", "sim_s_id");
            this.renameProperty(element, "length", "code_length");

            if ((request_query.contest_id && browser_privilege) || !request_query.contest_id || _end) {
                return element;
            } else {
                const owner = req.session.user_id === val.user_id;
                return Object.assign(element, {
                    memory: this.check_owner(val.memory, owner),
                    time: this.check_owner(val.time, owner),
                    length: this.check_owner(val.code_length, owner)
                });
            }
        }
        return val; // Fallback if user info missing, though unlikely
    }

    public async getStatusList(req: any, request_query: StatusQueryOptions) {
        const limit = request_query.limit || 0;
        let { where_sql, sql_arr } = this.generateSqlData(request_query);
        let pre_sim = "", end_sim = "";

        if (request_query.sim) {
            if (request_query.user_id) {
                let user_id_sql = "";
                // Logic preserved from original, though redundant if request_query.user_id is already in sql_arr via generateSqlData?
                // Actually generateSqlData handles 'user_id' if strictly passed.
                // But original logic specially handles subquery for sim.
                // Let's refine this: existing logic appends to where_sql.

                // Original: if (request_query.user_id) ... sql_arr.push ...
                // Note: generateSqlData might have already added 'user_id = ?'. 
                // We should be careful not to duplicate if the caller passes user_id in the generic object.
                // In the original code, `request_query` passed to `generateSqlData` is the SAME object passed to this block.
                // So `user_id` might be added twice?
                // Let's check original: generateSqlData(request_query) -> creates where_sql terms.
                // Then `if (request_query.user_id)` -> pushes another param to sql_arr and adds a subquery clause.
                // This implies `user_id` is used TWICE in SQL: once for `s_user_id` in subquery, and maybe once in main table?
                // Actually, looking at original code: `if (request_query.sim)` block handles specific logic.

                user_id_sql = " where s_user_id = ?";
                sql_arr.push(request_query.user_id);
                where_sql.push(` solution_id in (select s_id as solution_id from sim${user_id_sql})`);
            } else {
                pre_sim = "select * from(";
                end_sim = ")t where sim is not null";
            }
        }

        let _end: any = false;
        const browser_privilege = req.session.isadmin || req.session.source_browser ||
            (request_query.contest_id && await ContestAssistantManager.userIsContestAssistant(request_query.contest_id, req.session.user_id));

        let _res;
        let where_clause = "";

        // Standardize where clause
        if (browser_privilege) {
            if (where_sql.length > 0) {
                where_clause = ` where ${where_sql.join(" and ").trim()}`;
            }

            sql_arr.push(limit);

            let common_fields = "fingerprint,fingerprintRaw,solution_id,pass_rate,ip,contest_id,num,problem_id,user_id,time,memory,in_date,result,language,code_length,judger, \"local\" as oj_name";
            if (!request_query.contest_id) {
                common_fields = common_fields.replace("pass_rate,ip", "pass_rate,share,ip");
            }

            const orderBy = request_query.contest_id ? "order by sol.in_date desc,sol.solution_id desc" : "order by sol.solution_id desc";

            _res = await cache_query(`${pre_sim}select * from
                                (select ${common_fields}
                                from solution ${where_clause}) sol
                                left join sim on sim.s_id = sol.solution_id
                                ${orderBy}${end_sim} limit ?,20`, sql_arr);

        } else if (request_query.contest_id) {
            where_sql.unshift("problem_id > 0");
            where_clause = ` where ${where_sql.join(" and ").trim()}`;

            sql_arr.push(limit);
            const end_cnt = await cache_query("select count(1),end_time as cnt from contest where end_time<NOW() and contest_id = ?", [request_query.contest_id]);
            _end = end_cnt[0].cnt;

            _res = await cache_query(`${pre_sim}select * from
                                (select fingerprint,fingerprintRaw,solution_id,contest_id,ip,num,problem_id,user_id,time,memory,in_date,result,language,code_length,judger, "local" as oj_name 
                                from solution ${where_clause}) sol
                                left join sim on sim.s_id = sol.solution_id
                                order by sol.in_date desc, sol.solution_id desc${end_sim} limit ?,20`, sql_arr);
        } else {
            where_sql.unshift("problem_id > 0");
            where_sql.unshift("contest_id is null");
            where_clause = ` where ${where_sql.join(" and ").trim()}`;

            sql_arr.push(limit);

            const share_check = `if((share = 1 and not exists (select * from contest where contest_id in
           (select contest_id from contest_problem where solution.problem_id = contest_problem.problem_id)
          and end_time > NOW()) ),1,0) as share`;

            _res = await cache_query(`${pre_sim}select * from
                                (select fingerprint,fingerprintRaw,solution_id,
                                ${share_check}
                                ,pass_rate,problem_id,ip,contest_id,num,user_id,time,
                                memory,in_date,result,language,code_length,judger, "local" as oj_name from solution
                                ${where_clause}) sol
                                left join sim on sim.s_id = sol.solution_id
                                order by sol.in_date desc,sol.solution_id desc${end_sim} limit ?,20`, sql_arr);
        }

        let result = await Promise.all(_res.map((e: any) => this.buildResponse(req, e, request_query, browser_privilege, Boolean(_end))));

        return {
            result: result,
            const_list: const_name,
            self: req.session.user_id,
            isadmin: req.session.isadmin,
            browse_code: browser_privilege,
            end: Boolean(_end)
        };
    }

    public async getGraphData(contestId?: number) {
        const SECONDS = 1000;
        const MINUTES = 60 * SECONDS;
        const HOURS = 60 * MINUTES;
        const DAYS = 24 * HOURS;
        const WEEKS = 7 * DAYS;
        const MONTH = 30 * DAYS;
        const YEARS = 365 * DAYS;

        const calculateDiffTimeMilliseconds = (diff_time: any) => {
            return diff_time.years * YEARS
                + diff_time.months * MONTH
                + diff_time.weeks * WEEKS
                + diff_time.days * DAYS
                + diff_time.minutes * MINUTES
                + diff_time.seconds * SECONDS
                + diff_time.milliseconds;
        };

        if (contestId) {
            const result = await cache_query("SELECT * FROM contest WHERE contest_id = ?", [contestId]);
            if (result.length) {
                const start_time = new Date(result[0].start_time), end_time = new Date(result[0].end_time);
                // @ts-ignore
                const timediff = require("timediff");
                const diffMilliseconds = calculateDiffTimeMilliseconds(timediff(start_time, new Date(Math.min(new Date().getTime(), end_time.getTime()))));

                let granularity = TIME_GRANULARITY.MONTH;
                if (diffMilliseconds > 10 * MONTH) {
                    granularity = TIME_GRANULARITY.MONTH;
                } else if (diffMilliseconds > 12 * DAYS) {
                    granularity = TIME_GRANULARITY.DAY;
                } else if (diffMilliseconds > 12 * HOURS) {
                    granularity = TIME_GRANULARITY.HOUR;
                } else if (diffMilliseconds > 12 * MINUTES) {
                    granularity = TIME_GRANULARITY.MINUTE;
                } else {
                    granularity = TIME_GRANULARITY.SECOND;
                }

                const data = await getGraphDataWithCache(contestId, granularity);
                return {
                    result: data,
                    label: getGraphLabel(granularity)
                };
            }
        }

        // Global stats
        const data = await getGraphDataWithCache(0, TIME_GRANULARITY.MONTH);
        return {
            result: data,
            label: getGraphLabel(TIME_GRANULARITY.MONTH)
        };
    }
}

export default new StatusService();
