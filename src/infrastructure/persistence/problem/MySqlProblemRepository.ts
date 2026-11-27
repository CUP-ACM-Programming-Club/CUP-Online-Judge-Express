/**
 * 题目查询的 SQL（从 application/services/ProblemService 逐字搬来）。
 * 读语句沿用原 mysql_cache 的 2s 缓存（cachedQuery）；写语句直接 query（原外壳也会把它识别为写语句、不缓存）。
 * 拼进 SQL 的 vjudge / prefix 只会是 "" 或 "vjudge_"。
 */
import { query, cachedQuery, LEGACY_CACHE_TTL_MS } from "../../db";

/** 与原 mysql_cache 相同的 2s 读缓存（本文件经它的 SQL 都不含 update/insert/delete 字样，旧外壳同样会缓存） */
const CACHE = { ttlMs: LEGACY_CACHE_TTL_MS };
const cache_query = (sql: string, params?: any[]) => cachedQuery<any>(sql, params, CACHE);
import { ProblemRepository } from "../../../application/ports/ProblemRepository";

export class MySqlProblemRepository implements ProblemRepository {
    findUploaderRows(problem_id: any) {
        return cache_query("SELECT user_id from privilege where rightstr = ?", ["p" + problem_id]);
    }

    findRunningContestProblemRows(problem_id: any) {
        return cache_query("select problem_id from contest_problem where contest_id in (select contest_id from contest where end_time > NOW()) and problem_id = ?", [problem_id]);
    }

    findPrefiles(problemId: any) {
        return cache_query("SELECT * FROM prefile WHERE problem_id = ?", [problemId]);
    }

    findLocalProblemWithCreator(id: any) {
        return cache_query(`select a.*,privilege.user_id as creator
from (SELECT * FROM problem WHERE problem_id = ?)a
       left join privilege on privilege.rightstr = CONCAT('p', ?)`, [id, id]);
    }

    findLocalProblem(id: any) {
        return cache_query("SELECT * FROM problem WHERE problem_id = ?", [id]);
    }

    findVjudgeProblem(id: any, source: string) {
        return cache_query("SELECT * FROM vjudge_problem WHERE problem_id=? AND source=?", [id, source]);
    }

    findPublicVjudgeProblem(id: any, source: string) {
        return cache_query(`SELECT * FROM vjudge_problem WHERE problem_id = ? and source = ? 
			and CONCAT(problem_id,source) NOT IN (SELECT CONCAT(problem_id,source) FROM contest_problem 
			where  contest_id IN (SELECT contest_id FROM contest WHERE end_time > NOW()
			OR private = 1))`, [id, source]);
    }

    findUserSourceCode(solution_id: any, user_id: any, browse_privilege: boolean) {
        return cache_query(`SELECT source FROM source_code_user WHERE solution_id = ?
			${browse_privilege ? "" : " AND solution_id in (select solution_id from solution where user_id = ? or if((share = 1\n" +
                "           and not exists\n" +
                "           (select * from contest where contest_id in\n" +
                "           (select contest_id from contest_problem\n" +
                "           where solution.problem_id = contest_problem.problem_id)\n" +
                "          and end_time > NOW()) ),1,0))"}`, [solution_id, user_id]);
    }

    findSolutionLanguage(solution_id: any) {
        return cache_query("select language from solution where solution_id = ?", [solution_id]);
    }

    searchProblems(queryVal: string, isAdmin: boolean) {
        // 非 admin 只能搜到公开题：OR 条件整体加括号（修复：之前 defunct 过滤只作用于 problem_id，隐藏题可按标题等搜出）
        return cache_query(`SELECT * FROM problem WHERE ${(isAdmin ? "" : " defunct='N' AND")} 
			 (problem_id LIKE ? OR title LIKE ? OR source LIKE ? OR description LIKE ? OR label LIKE ?)`, [queryVal, queryVal, queryVal, queryVal, queryVal]);
    }

    findAllLabels(vjudge: string) {
        return cache_query(`select label from ${vjudge}problem`);
    }

    insertLabelIfAbsent(vjudge: string, i: string) {
        return query(`INSERT INTO ${vjudge}label_list (label_name)
SELECT * FROM (SELECT ?) AS tmp
WHERE NOT EXISTS (
    SELECT label_name FROM ${vjudge}label_list WHERE label_name = ?
) LIMIT 1;`, [i, i]);
    }

    findLabelList(vjudge: string) {
        return cache_query(`select label_name from ${vjudge}label_list`);
    }

    findContestEndTimesOfProblem(id: any) {
        return cache_query(`select UNIX_TIMESTAMP(end_time) as t from contest where contest_id in (select contest_id from contest_problem
         where problem_id = ?)`, [id]);
    }

    findSourceCodeWithOwner(sid: number, prefix: string) {
        return cache_query(`SELECT source,user_id FROM ${prefix}source_code WHERE solution_id=?`, [sid]);
    }
}
