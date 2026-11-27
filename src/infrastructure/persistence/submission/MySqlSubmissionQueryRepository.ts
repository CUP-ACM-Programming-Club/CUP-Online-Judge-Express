import SubmissionManager from "./SubmissionManager";
import { SubmissionQueryRepository } from "../../../application/ports/SubmissionQueryRepository";

import { query, cachedQuery, LEGACY_CACHE_TTL_MS } from "../../db";

/** 与原 mysql_cache 相同的 2s 读缓存（本文件经它的 SQL 都不含 update/insert/delete 字样，旧外壳同样会缓存） */
const CACHE = { ttlMs: LEGACY_CACHE_TTL_MS };
const cache_query = (sql: string, params?: any[]) => cachedQuery<any>(sql, params, CACHE);

/**
 * 提交读查询的 SQL，原样搬自 SubmissionService、status/info、status/sim、
 * routes/acmsubmit、routes/source、MaintainService。
 */
export class MySqlSubmissionQueryRepository implements SubmissionQueryRepository {
    async findSimRelatedSolutions(contestId?: number) {
        let sql = `select s.*,u2.nick as snick from(select t.*,u1.nick from (select * from sim where
		 s_user_id is not null and s_s_user_id is not null 
		 ${!contestId ? "" : ` and s_id in (select solution_id from
		 solution where contest_id = ?)`} )t left join users as u1
		on u1.user_id = t.s_user_id)s
 left join users as u2
		on u2.user_id = s.s_s_user_id`;
        const params = [];
        if (contestId) {
            params.push(contestId);
        }
        return await cache_query(sql, params);
    }

    async findContestSim(contest_id: any) {
        let sql = `select s_id, sim_s_id, sim, s_user_id, s_s_user_id,num from (select * from sim where s_id in (select solution_id from solution where contest_id = ?))a
left join solution on solution.solution_id = a.s_id`;
        return await query(sql, [contest_id]);
    }

    findRuntimeInfo(solutionId: number | string) {
        const sql = "SELECT `error` FROM `runtimeinfo` WHERE `solution_id`= ?";
        return cache_query(sql, [solutionId]);
    }

    findCompileInfo(solutionId: number | string) {
        const sql = "SELECT `error` FROM `compileinfo` WHERE `solution_id`= ?";
        return cache_query(sql, [solutionId]);
    }

    findInfoError(database: string, solution_id: any) {
        return cache_query(`select error from ${database} where solution_id = ?`, [solution_id]);
    }

    findSolutionUser(solution_id: any) {
        return cache_query("select user_id from solution where solution_id = ?", [solution_id]);
    }

    findSharedSolutionInfo(solutionId: number | string) {
        return cache_query(`SELECT user_id,
                                            language,
                                            if((share = 1 or solution_id in (select solution_id from
                                             tutorial where solution.solution_id = ?)) and not exists
                                             (select * from contest where contest_id in (select contest_id
                                             from contest_problem where solution.problem_id = contest_problem.problem_id)
                                             and end_time > NOW()), 1, 0) as share,time,memory,code_length from solution
                                     WHERE solution_id = ?`, [solutionId, solutionId]);
    }

    findSolutionDetail(solutionId: number | string) {
        return cache_query("select * from solution where solution_id=?", [solutionId]);
    }

    countByResult() {
        return cache_query("select count(1) as cnt,result from solution group by result order by result");
    }

    findAcceptedCodeLength(statement: string, sqlArr: any[]) {
        return cache_query(`select in_date, code_length from solution where ${statement} and result = 4`, sqlArr);
    }

    findUserSourceCode(solutionId: number | string) {
        return cache_query("select source from source_code_user where solution_id = ?", [solutionId]);
    }

    findSourceView(local: boolean, id: number, browse_code: boolean, userId: any) {
        const source = local ? "source_code_user" : "vjudge_source_code";
        const solution = local ? "solution" : "vjudge_solution";
        const sql = `select * from (select ${solution}.*,${source}.source from ${source} left join
  ${solution} on ${solution}.solution_id = ${source}.solution_id)tmp
where solution_id = ? ${browse_code ? "" : `and (user_id = ? or share = true or solution_id in 
(select solution_id from tutorial))`}`;
        // noinspection JSAnnotator
        const sqlArr = browse_code ? [id] : [id, userId];
        return cache_query(sql, sqlArr);
    }

    findVjudgeOjName(id: number) {
        return cache_query("select oj_name from vjudge_solution where solution_id = ?", [id]);
    }

    findRecentAcmSubmissions(name?: string) {
        let wheresql = "";
        let andsql = "";
        let sqlArr: string[] = [];
        if (name) {
            wheresql = " where user_id = ? ";
            andsql = " and user_id = ? ";
            for (let i = 0; i < 3; ++i) {
                sqlArr.push(name);
            }
        }

        let sql = `select t.*,users.nick from(select user_id,oj_name,problem_id,time,result,time_running,
	memory,code_length,language
	 from vjudge_record 
	 ${wheresql}
union all
    select user_id,oj_name,problem_id,in_date as time,result,time as time_running
    ,memory,code_length,language
    from vjudge_solution 
      where user_id in (select user_id from users_account) ${andsql}
  union all
  select user_id,"LOCAL" as oj_name,problem_id,in_date as time,result,time as time_running
    ,memory,code_length,language from solution
  where user_id in (select user_id from users_account) and problem_id > 1909 ${andsql}
order by time desc limit 500)t
left join users
  on users.user_id = t.user_id`;
        return cache_query(sql, sqlArr);
    }

    getSubmissionHourInfo() {
        return SubmissionManager.getSubmissionHourInfoCache();
    }

    findMaintainInfo(limit: boolean) {
        return cache_query(`select * from maintain_info order by mtime desc ${limit ? "limit 1" : ""}`);
    }
}
