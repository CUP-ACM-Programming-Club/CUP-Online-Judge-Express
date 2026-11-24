/**
 * 题目查询的 SQL（从 application/services/ProblemService 逐字搬来）。
 * 继续走 legacy mysql_cache 外壳：它的 2s 缓存与「写语句不缓存」启发式是现有行为的一部分。
 */
import cache_query = require("../../db/legacy/mysql_cache");
import query = require("../../db/legacy/mysql_query");
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
        return cache_query(`SELECT * FROM problem WHERE ${(isAdmin ? "" : " defunct='N' AND")} 
			 problem_id LIKE ? OR title LIKE ? OR source LIKE ? OR description LIKE ? OR label LIKE ?`, [queryVal, queryVal, queryVal, queryVal, queryVal]);
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
