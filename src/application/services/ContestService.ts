
import { Request } from "express";
import dayjs from "dayjs";
import { error, ok } from "../../domain/constants/state";
import cache_query = require("../../infrastructure/db/legacy/mysql_cache");
import query = require("../../infrastructure/db/legacy/mysql_query");
import ContestManager from "../../infrastructure/persistence/contest/ContestManager";
import ContestCachePool = require("../contest/ContestCachePool");
import HttpError from "../../domain/errors/HttpError";
import { assertCanViewContest, canBrowseSource, canManageContest, canSeeHiddenContests } from "../../domain/policy/predicates";

class ContestService {

    async getContestList(req: Request) {
        return await ContestManager.getContestList(req);
    }

    async getContestListAsObject(req: Request) {
        return await ContestManager.getContestListAsObjectByRequest(req);
    }

    async getAllContestList(req: Request) {
        // ContestManager wraps the rows as { status: "OK", data: [...] } (ErrorHandlerFactory(ok.okMaker))
        const result = await ContestManager.getAllContestList();
        if (canSeeHiddenContests(req)) {
            return result;
        }
        // same visibility rule as the paged contest list: hidden contests are for admins / contest managers only
        if (result && Array.isArray(result.data)) {
            return { ...result, data: result.data.filter((contest: any) => contest.defunct === "N") };
        }
        return result;
    }

    async getTotalNumber(req: Request) {
        return await ContestManager.getTotalNumber(req);
    }

    /**
     * Check if a contest exists and if the user has access to it.
     * Returns the contest detail if accessible.
     * Throws HttpError if not accessible or invalid.
     */
    async checkContestAccess(req: Request, cid: number) {
        if (isNaN(cid) || cid < 1000) {
            throw new HttpError("Invalid Contest ID", 400);
        }

        const contest = await cache_query("SELECT * FROM contest WHERE contest_id = ?", [cid]);
        if (!contest || contest.length === 0) {
            throw new HttpError("Contest not found", 404);
        }

        const contestDetail = contest[0];
        // 判定规则见 src/policy/predicates.ts assertCanViewContest（admin | maker 豁免、contest_mode、隐藏、未开始、私有）
        await assertCanViewContest(req, contestDetail, cid);
        return contestDetail;
    }

    async getContestGeneralDetail(cid: number) {
        const cacheKey = `Contest:info:${cid}`;
        const cache = await ContestCachePool.get(cacheKey);
        if (cache) {
            return cache.data;
        }

        const contest_general_detail = await cache_query(`select t1.contest_id,t1.title,t1.start_time,
		t1.end_time,t1.description,t1.cmod_visible,t2.total_problem from (select * from contest where contest_id = ?)t1
  left join (select count(1)total_problem,contest_id from contest_problem where contest_id = ?)t2
  on t1.contest_id = t2.contest_id`, [cid, cid]);

        if (contest_general_detail.length < 1) {
            throw new HttpError("Contest not found", 404, error.invalidParams);
        }

        ContestCachePool.set(cacheKey, contest_general_detail[0]);
        return contest_general_detail[0];
    }

    async getContestProblemList(req: Request, cid: number) {
        const contestDetail = await this.checkContestAccess(req, cid);

        const contest_is_end = dayjs(contestDetail.end_time).isBefore(dayjs());
        let contestProblemList: any[] = [];

        // Fetch Problems (Cached)
        // This query matches the complicated logic in module/contest/problem.js
        const vjudge = contestDetail.vjudge;
        if (vjudge) {
            contestProblemList = await cache_query(`select * from (SELECT \`problem\`.\`title\` as \`title\`,\`problem\`.\`problem_id\` as \`pid\`,source as source,"LOCAL" as oj_name,contest_problem.num as pnum
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
        } else {
            contestProblemList = await cache_query(`select *
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

        // Fetch User Submission Status (Uncached/Short Cache?) - User specific
        // We only need to know if they AC'd or attempted
        const submission_data = await cache_query(`select count(1) as cnt,problem_id,result,language from solution where 
			user_id = ? and contest_id = ?
and result <> 13
group by problem_id,result`, [req.session!.user_id, cid]);

        const limit_data = await cache_query("select limit_hostname from contest where contest_id = ?", [cid]);

        // Merge User Status
        const submission_map: any = {};
        for (const sub of submission_data) {
            if (!submission_map[sub.problem_id]) {
                submission_map[sub.problem_id] = { ac: false };
            }
            if (sub.result === 4) submission_map[sub.problem_id].ac = true;
        }

        for (const prob of contestProblemList) {
            const status = submission_map[prob.pid];
            if (status) {
                prob.ac = status.ac ? 1 : -1;
            } else {
                prob.ac = 0;
            }
        }

        const browse_privilege = await canManageContest(req, cid);

        if (!browse_privilege && !contest_is_end) {
            // Mask PIDs during contest
            for (const prob of contestProblemList) {
                prob.pid = prob.pid1 = prob.pid2 = "";
            }
        }

        delete contestDetail.password; // Security

        return {
            status: "OK",
            data: contestProblemList,
            info: contestDetail,
            admin: browse_privilege,
            limit: limit_data[0].limit_hostname,
            // @ts-ignore
            contest_mode: global.contest_mode
        };
    }

    async getContestStatistics(req: Request, cid: number) {
        if (isNaN(cid) || cid < 1000) {
            throw new HttpError("Invalid Contest ID", 400, error.invalidParams);
        }

        // This also validates access by returning (or throwing)
        // But for statistics, maybe looser check (if public)? 
        // Original code checks "if (~cid && cid >= 1000)" then does queries.
        // It doesn't explicitly check privilege in route? 
        // Wait, route /statistics/:cid logic: parameters check -> query.
        // It seems PUBLIC statistics if contest is found?
        // But standard contest access rules 'should' apply if it's private.
        // The original route DID NOT check privilege explicitly, implying it might be public info or relies on front-end to block?
        // HOWEVER, accessing statistics of a PRIVATE contest without logging in is often a leak.
        // I will enforce checkContestAccess to be safe, or least basic check.
        // Re-reading original route:
        /*
        router.get("/statistics/:cid", async (req: any, res: any) => {
           let cid = ...
           if (~cid && cid >= 1000) { ... perform query ... } else { error }
        });
        */
        // It seems the original code was OPEN.
        // I will keep it open to avoid breaking changes, but maybe I should check if contest exists.

        const [contest_statistics_detail, total] = await Promise.all([
            cache_query(`SELECT
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
          WHERE \`contest_id\` = ? and num >= 0`, [cid, cid])
            ,
            cache_query("select count(1)total_problem,contest_id from contest_problem where contest_id = ?", [cid])
        ]);

        return {
            status: "OK",
            data: contest_statistics_detail,
            total: total[0].total_problem
        };
    }

    async checkPassword(req: Request, cid: number, password: string) {
        if (isNaN(cid) || cid < 1000) {
            throw new HttpError("Invalid Contest ID", 400, error.invalidParams);
        }

        const contest_detail = await cache_query("select * from contest where contest_id = ?", [cid]);
        if (contest_detail.length < 1) {
            throw new HttpError("Contest not found", 404, error.invalidParams);
        }

        const realPassword = contest_detail[0].password;
        if (realPassword && realPassword.length > 0 && realPassword.toString() === password.toString()) {
            req.session!.contest[`c${cid}`] = true;

            // Async privilege update
            query("select * from privilege where user_id = ? and rightstr = ?", [req.session!.user_id, `c${cid}`])
                .then((rows: any) => (rows.length === 0) ?
                    query("insert into privilege(user_id,rightstr)values(?,?)", [req.session!.user_id, `c${cid}`]) : false
                );

            return { status: "OK" };
        } else {
            throw new HttpError("Wrong password", 200, error.errorMaker("Wrong password"));
        }
    }
    async getContestProblemDetails(req: Request, cid: number, pid: number, sid?: number) {
        const [contest, result] = await Promise.all([
            cache_query("SELECT * FROM contest WHERE contest_id = ?", [cid]),
            cache_query("SELECT * FROM contest_problem WHERE contest_id = ? and num = ?", [cid, pid])
        ]);

        if (!contest || contest.length === 0) {
            throw new HttpError("Contest not found", 404);
        }

        // This mirrors `checkPrivilege` check in router but inside service
        // We should use `checkContestAccess`? 
        // The router uses `checkContestPrivilege` which calls `checkContestAccess`.
        // Let's use `checkContestAccess` at the start if we want to be strict.
        // But the original logic:
        // 1. check Privilege(req) (admin/browser) -> if false: check cmod_visible
        // 2. check private -> if 1: checkContestPrivilege

        const isPrivileged = canBrowseSource(req);
        if (!isPrivileged) {
            // @ts-ignore
            if (global.contest_mode && parseInt(contest[0].cmod_visible) === 0) {
                throw error.contestMode;
            }
        }

        if (parseInt(contest[0].private) === 1) {
            await this.checkContestAccess(req, cid);
        }

        if (result.length > 0) {
            if (result[0].oj_name && result[0].oj_name.length > 0) {
                return {
                    redirect: true,
                    url: `${result[0].oj_name.toLowerCase()}submitpage.php?cid=${cid}&pid=${pid}`
                };
            }
            let { langmask, end_time, limit_hostname } = contest[0];
            let problem_id = result[0].problem_id;

            // To avoid circular dependency with ProblemService if we import entire service,
            // we might need to handle this carefully.
            // But ProblemService is already imported or can be imported. 
            const ProblemService = require("./ProblemService").default;

            return await ProblemService.getProblem(req, {
                id: problem_id,
                cid,
                pid,
                source: result[0].oj_name || "",
                langmask,
                after_contest: dayjs().isAfter(dayjs(end_time)),
                limit_hostname,
                solution_id: sid
            });
        } else {
            throw error.invalidParams;
        }
    }
}

export default new ContestService();
