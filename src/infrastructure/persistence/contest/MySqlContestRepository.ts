import { ContestListCriteria, ContestRepository } from "../../../application/ports/ContestRepository";
import { contest as Contest, contestProblem as ContestProblem } from "../../orm/ts-model";
import ContestManager from "./ContestManager";
import { query, cachedQuery, LEGACY_CACHE_TTL_MS } from "../../db";

/** 与原 mysql_cache 相同的 2s 读缓存（本文件经它的 SQL 都不含 update/insert/delete 字样，旧外壳同样会缓存） */
const CACHE = { ttlMs: LEGACY_CACHE_TTL_MS };
const cache_query = (sql: string, params?: any[]) => cachedQuery<any>(sql, params, CACHE);

/**
 * 比赛数据访问。SQL 逐字搬自原 application/services/ContestService、application/contest/ContestInfoManager、
 * application/problem/ContestFinder、interfaces/http/middleware/contest_mode；
 * 读语句沿用原 mysql_cache 的 2s 缓存（cachedQuery），写语句直接 query。
 * 比赛列表相关的 SQL 拼装与缓存在 ContestManager。
 */
export class MySqlContestRepository implements ContestRepository {
    listContests(criteria: ContestListCriteria) {
        return ContestManager.getContestList(criteria);
    }

    countContests(criteria: ContestListCriteria) {
        return ContestManager.getContestListCount(criteria);
    }

    countAllMatching(criteria: ContestListCriteria) {
        return ContestManager.getTotalNumber(criteria);
    }

    findAllContests() {
        return ContestManager.getAllContest();
    }

    findContestById(cid: number) {
        return cache_query("SELECT * FROM contest WHERE contest_id = ?", [cid]);
    }

    findContestForPassword(cid: number) {
        return cache_query("select * from contest where contest_id = ?", [cid]);
    }

    findContestGeneralDetail(contestId: number) {
        return cache_query(`select t1.contest_id,t1.title,t1.start_time,
		t1.end_time,t1.description,t1.cmod_visible,t2.total_problem from (select * from contest where contest_id = ?)t1
  left join (select count(1)total_problem,contest_id from contest_problem where contest_id = ?)t2
  on t1.contest_id = t2.contest_id`, [contestId, contestId]);
    }

    findContestProblems(cid: number, vjudge: boolean) {
        if (vjudge) {
            return cache_query(`select * from (SELECT \`problem\`.\`title\` as \`title\`,\`problem\`.\`problem_id\` as \`pid\`,source as source,"LOCAL" as oj_name,contest_problem.num as pnum
		FROM \`contest_problem\`,\`problem\`
		WHERE \`contest_problem\`.\`problem_id\`=\`problem\`.\`problem_id\` 
		AND \`contest_problem\`.\`contest_id\`= ? AND \`contest_problem\`.\`oj_name\` IS NULL ORDER BY \`contest_problem\`.\`num\` 
                ) problem
                left join (select problem_id pid1,num,count(1) accepted from solution where result=4 and contest_id= ? group by pid1) p1 on problem.pid=p1.pid1
                left join (select problem_id pid2,num,count(1) submit from solution where contest_id= ?  group by pid2) p2 on problem.pid=p2.pid2
union all
select * from (SELECT \`vjudge_problem\`.\`title\` as \`title\`,\`vjudge_problem\`.\`problem_id\` as \`pid\`,"" as source,source as oj_name,contest_problem.num as pnum FROM
 \`contest_problem\`,\`vjudge_problem\`
WHERE \`contest_problem\`.\`problem_id\`=\`vjudge_problem\`.\`problem_id\`
AND \`contest_problem\`.\`contest_id\`= ? AND \`contest_problem\`.\`oj_name\`=\`vjudge_problem\`.\`source\` ORDER BY \`contest_problem\`.\`num\`) vproblem
left join(select problem_id pid1,num,count(1) accepted from vjudge_solution where result=4 and contest_id= ? group by num) vp1 on vproblem.pid=vp1.pid1 and vproblem.pnum=vp1.num
left join(select problem_id pid2,num,count(1) submit from vjudge_solution where contest_id= ? group by num) vp2 on vproblem.pid=vp2.pid2 and vproblem.pnum=vp2.num
order by pnum;`, [cid, cid, cid, cid, cid, cid]);
        }
        return cache_query(`select *
from (SELECT
        \`problem\`.\`title\`      as \`title\`,
        \`problem\`.\`problem_id\` as \`pid\`,
        source                 as source,
        contest_problem.num    as pnum

      FROM \`contest_problem\`, \`problem\`

      WHERE \`contest_problem\`.\`problem_id\` = \`problem\`.\`problem_id\`

            AND \`contest_problem\`.\`contest_id\` = ? AND \`contest_problem\`.\`oj_name\` IS NULL
      ORDER BY \`contest_problem\`.\`num\`
     ) problem
  left join (select
               problem_id pid1,
               num,
               count(1)   accepted
             from solution
             where result = 4 and contest_id = ?
             group by pid1) p1 on problem.pid = p1.pid1
  left join (select
               problem_id pid2,
               num,
               count(1)   submit
             from solution
             where contest_id = ?
             group by pid2) p2 on problem.pid = p2.pid2
union all
select *
from (SELECT
        \`vjudge_problem\`.\`title\`      as \`title\`,
        \`vjudge_problem\`.\`problem_id\` as \`pid\`,
        source                        as source,
        contest_problem.num           as pnum
      FROM
        \`contest_problem\`, \`vjudge_problem\`
      WHERE \`contest_problem\`.\`problem_id\` = \`vjudge_problem\`.\`problem_id\`
            AND \`contest_problem\`.\`contest_id\` = ? AND \`contest_problem\`.\`oj_name\` = \`vjudge_problem\`.\`source\`
      ORDER BY \`contest_problem\`.\`num\`) vproblem
  left join (select
               problem_id pid1,
               num,
               count(1)   accepted
             from vjudge_solution
             where result = 4 and contest_id = ?
             group by num) vp1 on vproblem.pid = vp1.pid1 and vproblem.pnum = vp1.num
  left join (select
               problem_id pid2,
               num,
               count(1)   submit
             from vjudge_solution
             where contest_id = ?
             group by num) vp2 on vproblem.pid = vp2.pid2 and vproblem.pnum = vp2.num
order by pnum;`, [cid, cid, cid, cid, cid, cid]);
    }

    findUserSubmissionSummary(userId: string, cid: number) {
        return cache_query(`select count(1) as cnt,problem_id,result,language from solution where 
			user_id = ? and contest_id = ?
and result <> 13
group by problem_id,result`, [userId, cid]);
    }

    findContestLimitHostname(cid: number) {
        return cache_query("select limit_hostname from contest where contest_id = ?", [cid]);
    }

    findContestStatistics(cid: number) {
        return cache_query(`SELECT
  \`result\`,
  \`num\`,
  \`language\`
FROM \`solution\`
WHERE \`contest_id\` = ? and num >= 0
union all SELECT
            \`result\`,
            \`num\`,
            \`language\`
          FROM \`vjudge_solution\`
          WHERE \`contest_id\` = ? and num >= 0`, [cid, cid]);
    }

    countContestProblems(cid: number) {
        return cache_query("select count(1)total_problem,contest_id from contest_problem where contest_id = ?", [cid]);
    }

    findContestProblem(cid: number, pid: number) {
        return cache_query("SELECT * FROM contest_problem WHERE contest_id = ? and num = ?", [cid, pid]);
    }

    grantContestPrivilege(userId: string, cid: number) {
        return query("select * from privilege where user_id = ? and rightstr = ?", [userId, `c${cid}`])
            .then((rows: any) => (rows.length === 0) ?
                query("insert into privilege(user_id,rightstr)values(?,?)", [userId, `c${cid}`]) : false
            );
    }

    findContestModel(contestId: number) {
        return Contest.findOne({
            // 直接使用列名 contest_id（模型属性名为 contestId）；sequelize 会原样作为列名，v6 类型需显式放宽
            where: {
                contest_id: contestId
            } as any
        });
    }

    findContestProblemModelsByProblemId(problemId: number) {
        return ContestProblem.findAll({
            // 直接使用列名 problem_id（模型属性名为 problemId）；sequelize 会原样作为列名，v6 类型需显式放宽
            where: {
                problem_id: problemId
            } as any
        });
    }

    findContestModeSetting() {
        return cache_query("select value from global_setting where label = 'contest'");
    }

    updateContestCompetitor(contestIdList: (string | number)[], userList: string[], newContestIdList: (string | number)[]) {
        return ContestManager.updateContestCompetitor(contestIdList, userList, newContestIdList);
    }
}

export default new MySqlContestRepository();
