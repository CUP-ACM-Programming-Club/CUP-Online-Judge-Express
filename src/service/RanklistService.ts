
import cache_query from "../module/mysql_cache";
import dayjs from "dayjs";
import const_variable from "../module/const_name";
import { error } from "../module/constants/state";

interface RanklistOptions {
    page: number;
    search: string;
    time_stamp?: string;
    vjudge: boolean;
    acm_member?: boolean;
    retired_member?: boolean;
}

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

    async getRanklist(opt: RanklistOptions) {
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
            if (!opt.vjudge) {
                const solutions = await cache_query(`
                    SELECT user_id, problem_id
                    FROM solution 
                    WHERE in_date >= ? AND result = 4`, [time_start]);

                if (solutions && solutions.length > 0) {
                    const stats: any = {};
                    for (const sol of solutions) {
                        if (!stats[sol.user_id]) {
                            stats[sol.user_id] = new Set();
                        }
                        stats[sol.user_id].add(sol.problem_id);
                    }

                    const sortedUsers = Object.keys(stats).map(uid => ({
                        user_id: uid,
                        solved: stats[uid].size
                    })).sort((a, b) => b.solved - a.solved).slice(page, page + this.PAGE_CNT);

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
                    result = [];
                }
            } else {
                const solutions = await cache_query(`
                    SELECT user_id, CONCAT(oj_name,problem_id) as problem_hash
                    FROM vjudge_solution 
                    WHERE in_date >= ? AND result = 4`, [time_start]);

                if (solutions && solutions.length > 0) {
                    const stats: any = {};
                    for (const sol of solutions) {
                        if (!stats[sol.user_id]) {
                            stats[sol.user_id] = new Set();
                        }
                        stats[sol.user_id].add(sol.problem_hash);
                    }

                    const sortedUsers = Object.keys(stats).map(uid => ({
                        user_id: uid,
                        solved: stats[uid].size
                    })).sort((a, b) => b.solved - a.solved).slice(page, page + this.PAGE_CNT);

                    const userIds = sortedUsers.map(u => u.user_id);
                    const users = await cache_query(`SELECT user_id, nick, biography, email, avatar, avatarUrl 
                        FROM users WHERE user_id IN (?)`, [userIds]);

                    const userMap = new Map();
                    users.forEach((u: any) => userMap.set(u.user_id, u));

                    const submits = await cache_query(`
                        SELECT user_id
                        FROM vjudge_solution 
                        WHERE in_date >= ? AND user_id IN (?)`, [time_start, userIds]);

                    const submitStats: any = {};
                    for (const sub of submits) {
                        if (!submitStats[sub.user_id]) submitStats[sub.user_id] = 0;
                        submitStats[sub.user_id]++;
                    }

                    result = sortedUsers.map((s) => {
                        const user = userMap.get(s.user_id);
                        return {
                            ...user,
                            vjudge_accept: s.solved,
                            vjudge_submit: submitStats[s.user_id] || 0
                        };
                    });
                } else {
                    result = [];
                }
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

        return {
            ranklist: result,
            _name: const_variable.language.cn.ranklist
        };
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
