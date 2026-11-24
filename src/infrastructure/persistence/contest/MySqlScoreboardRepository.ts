import { ScoreboardRepository } from "../../../application/ports/ScoreboardRepository";
import cache_query = require("../../db/legacy/mysql_cache");

/** 榜单查询。SQL 逐字搬自原 application/services/ScoreboardService（仍走 legacy mysql_cache，缓存行为不变）。 */
export class MySqlScoreboardRepository implements ScoreboardRepository {
    findContestSubmissions(cid: number, browserPrivilege: boolean) {
        return cache_query(`
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
    }

    findUsersByIds(userIds: string[]) {
        return cache_query(`
                SELECT user_id, nick, avatar, avatarUrl 
                FROM users 
                WHERE user_id IN (?)
              `, [userIds]);
    }

    findSimBySolutionIds(solutionIds: number[]) {
        return cache_query(`
                SELECT s_id, sim FROM sim WHERE s_id IN (?)
              `, [solutionIds]);
    }

    findContestUsers(cid: number) {
        const sql4 = `select t.*,users.nick from (select user_id from privilege where rightstr = ?)t
left join users on users.user_id = t.user_id`;
        return cache_query(sql4, ["c" + cid]);
    }

    countContestProblems(cid: number) {
        const sql2 = "select count(distinct num)total_problem from contest_problem where contest_id = ?";
        return cache_query(sql2, [cid]);
    }

    findContestHeader(cid: number) {
        const sql3 = "select start_time,title,show_all_ranklist from contest where contest_id = ?";
        return cache_query(sql3, [cid]);
    }

    async findLineBreakInfo(cid: number) {
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
}

export default new MySqlScoreboardRepository();
