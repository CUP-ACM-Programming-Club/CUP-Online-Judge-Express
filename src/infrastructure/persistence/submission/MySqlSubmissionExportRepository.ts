import { SubmissionExportRepository } from "../../../application/ports/SubmissionExportRepository";

import cache_query = require("../../db/legacy/mysql_cache");
import query = require("../../db/legacy/mysql_query");

/** 导出相关 SQL，原样搬自 ExportService 与 routes/export_rpk。 */
export class MySqlSubmissionExportRepository implements SubmissionExportRepository {
    findUserIdsByNick(nick: string) {
        return query("select user_id from users where nick = ?", [nick]);
    }

    findContestAcceptedCode(contest_id: number | string) {
        return query(`select S.user_id,nick,problem_id,result,source,S.language from source_code right join
(select solution_id,problem_id,user_id,result,language,num from solution where contest_id= ?
  and result = 4) S
on source_code.solution_id=S.solution_id
left join users on users.user_id = S.user_id
 order by S.user_id asc,S.num asc`, [contest_id]);
    }

    findProblem(problem_id: any) {
        return cache_query("SELECT * FROM problem WHERE problem_id = ?", [problem_id]);
    }

    findFastestSolution(problem_id: any) {
        return cache_query(`select * from (
select source_code_user.source,solution.problem_id,time,language from solution left join source_code_user on source_code_user.solution_id = solution.solution_id)
sol where problem_id = ? order by sol.time limit 1`, [problem_id]);
    }

    findPrefiles(problem_id: any) {
        return cache_query("select * from prefile where problem_id = ?", [problem_id]);
    }

    findContestProblems(contest_id: number) {
        return cache_query("SELECT * FROM contest_problem WHERE contest_id = ?", [contest_id]);
    }
}
