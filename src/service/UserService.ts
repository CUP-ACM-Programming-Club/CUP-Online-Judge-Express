
import query = require("../module/mysql_query");
const cache_query = require("../module/mysql_cache");

class UserService {
    /**
     * Get User Profile Data for Profile Page
     * @param user_id 
     */
    async getUserProfile(user_id: string) {
        let sqlQueue: Promise<any>[] = [];
        // 0. Submission stats (vjudge + local)
        sqlQueue.push(query(`
select * from (select "LOCAL" as oj_name,problem_id,result,language,in_date as time from solution where user_id = ? and problem_id > 0
union all
select oj_name,problem_id,result,language,in_date as time from vjudge_solution where user_id = ?
union all
select oj_name,problem_id,result,language,time from vjudge_record where user_id = ? and oj_name != "CUP"
)t
`, [user_id, user_id, user_id]));

        // 1. Privilege
        sqlQueue.push(query("select * from privilege where user_id = ? and rightstr in ('administrator','editor','source_browser')", [user_id]));
        // 2. Award
        sqlQueue.push(query("select * from award where user_id = ? order by year", [user_id]));
        // 3. User Info
        sqlQueue.push(query("select avatar,avatarUrl,school,email,blog,github,reg_time,nick,biography,vjudge_accept from users where user_id = ?", [user_id]));
        // 4. ACM Member
        sqlQueue.push(query("select * from acm_member where user_id = ?", [user_id]));
        // 5. Special Subject
        sqlQueue.push(query("select * from special_subject_problem"));
        // 6. Rank
        sqlQueue.push(query("select count(1) + 1 as rnk from users where solved > (select solved from users where user_id = ?)", [user_id]));
        // 7. Login Time
        sqlQueue.push(query("select time from loginlog where user_id = ? order by time desc limit 1", [user_id]));
        // 8. Articles
        sqlQueue.push(query("select title,article_id from article where user_id = ? order by create_time desc", [user_id]));
        // 9. Submission Count Timeline
        sqlQueue.push(query(`select count(1) as cnt,year(in_date) as year,month(in_date) as month,day(in_date) as day from solution
where user_id = ? and in_date >= DATE_SUB(NOW(),INTERVAL 1 YEAR)
group by year(in_date),month(in_date),day(in_date)`, [user_id]));
        // 10. OS Stats
        sqlQueue.push(query(`select count(1) as cnt,os_name,os_version from loginlog 
where user_id = ? and os_name is not null
group by os_name,os_version`, [user_id]));
        // 11. Browser Stats
        sqlQueue.push(query(`select count(1) as cnt,browser_name,browser_version from loginlog
where user_id = ? and browser_name is not null
group by browser_name,browser_version`, [user_id]));
        // 12. SIM Count
        sqlQueue.push(query(`select count(distinct(problem_id)) as cnt from solution where solution_id in (
  select s_id as solution_id
  from sim
  where s_user_id = ?
)`, [user_id]));
        // 13. SIM Average
        sqlQueue.push(query("select avg(sim) as average from sim where s_user_id = ?", [user_id]));
        // 14. SIM Average Code Length
        sqlQueue.push(query(`select avg(code_length) as average from solution where solution_id in (
  select s_id as solution_id
  from sim
  where s_user_id = ?
)`, [user_id]));
        // 15. Total SIM Time ??? (Query says count(1) from sim?) -> Actually checks sim count again?
        // Original code: sqlQueue.push(query("select count(1) as cnt from sim where s_user_id = ?", [user_id]));
        sqlQueue.push(query("select count(1) as cnt from sim where s_user_id = ?", [user_id]));
        // 16. Vjudge Rank
        sqlQueue.push(query("select count(1) + 1 as rnk from users where vjudge_accept > (select vjudge_accept from users where user_id = ?)", [user_id]));

        const result = await Promise.all(sqlQueue);

        return {
            submission: result[0],
            privilege: result[1],
            award: result[2],
            information: result[3][0],
            acm_user: result[4][0],
            special_subject: result[5],
            rank: result[6][0].rnk,
            // const_variable handled in controller
            login_time: result[7],
            article_publish: result[8],
            submission_count: result[9],
            browser: result[11],
            os: result[10],
            sim_count: result[12][0].cnt || 0,
            sim_average_percentage: result[13][0].average || 0,
            sim_average_length: result[14][0].average || 0,
            total_sim_time: result[15][0].cnt || 0,
            vjudge_rank: result[16][0].rnk
        };
    }

    async getUserInfoByUserId(user_id: string) {
        return await cache_query("select * from users where user_id = ?", [user_id]);
    }

    async getUserIdBySolutionId(solution_id: string | number) {
        const result = await cache_query("select user_id from solution where solution_id = ?", [solution_id]);
        return result.length > 0 ? result[0].user_id : null;
    }

    async getLoginLogStats(fields: string[] = ["time"]) {
        // Safe-guard against SQL injection by filtering allowed fields
        const allowedFields = ["time", "os_name", "os_version", "browser_name", "browser_version"];
        const filteredFields = fields.filter(f => allowedFields.includes(f));
        if (filteredFields.length === 0) {
            filteredFields.push("time");
        }
        return await cache_query(`select ${filteredFields.join(",")} from loginlog where browser_name is not null`);
    }

    async getUserByNick(nick: string) {
        return await cache_query("select user_id from users where nick = ?", [nick]);
    }

    async getRecentRegisteredUsers() {
        return await query("select user_id, nick, biography, solved,reg_time from users where email != 'your_own_email@internet' order by reg_time desc limit 50");
    }

    async getRegisterTimeline() {
        return await cache_query("select reg_time from users where school != 'your_own_school' order by reg_time asc");
    }

    private generateWhereStatement(args: any) {
        args = args.map((el: any) => {
            return el.join(" ");
        });
        return "where " + args.join(" and ");
    }

    private generateArguments(...args: any[]) {
        let result: any[] = [];
        if (args.length === 1) {
            result.push(["user_id", "=", "?"]);
        } else if (args.length === 3) {
            result.push(["user_id", "=", "?"], ["in_date", ">=", "?"], ["in_date", "<=", "?"]);
        }
        return result;
    }

    async getSubmitStat(...args: any[]) {
        const _this = this; // Capture this
        async function submitHandler(...args: any[]) {
            let argList = _this.generateArguments(...args);
            const sql = `SELECT users.user_id,
           users.nick,
           users.avatar,
           users.avatarUrl,
           solution.result,
           solution.num,
           solution.in_date,
           solution.fingerprint,
           solution.fingerprintRaw,
           solution.ip,
           sim.sim,
           solution.code_length,
           solution.solution_id
    FROM (select *
          from solution
          ${_this.generateWhereStatement(argList)}) solution
             left join users
                       on users.user_id = solution.user_id
             left join sim
                       on sim.s_id = solution.solution_id
    union all
    select users.user_id,
           users.nick,
           users.avatar,
           users.avatarUrl,
           vsol.result,
           vsol.num,
           vsol.in_date,
           ''   as fingerprint,
           ''   as fingerprintRaw,
           vsol.ip,
           null as sim,
           vsol.code_length,
           vsol.solution_id
    from (select *
          from vjudge_solution
          where ${_this.generateWhereStatement(argList)}) vsol
             left join users on users.user_id = vsol.user_id
    ORDER BY user_id, in_date`;
            return await cache_query(sql, [...args, ...args]);
        }

        async function lineBreakHandler(...args: any[]) {
            let argList = _this.generateArguments(...args);
            const sql = `select code_stat.solution_id,
           code_stat.line,
           user.user_id, user.problem_id
    from (select solution_id,
                 length(source) - length(replace(source, '\\n', '')) as line,
                 source
          from source_code_user
          where solution_id in
                (select solution_id
                 from solution
                 ${_this.generateWhereStatement(argList)})) code_stat
             left join
             (select user_id, solution_id, problem_id from solution ${_this.generateWhereStatement(argList)}) user
             on user.solution_id = code_stat.solution_id`;
            return await cache_query(sql, [...args, ...args]);
        }

        let [submitStat, line_break] = await Promise.all([submitHandler(...args), lineBreakHandler(...args)]);
        let map: any = {};
        for (const i of submitStat) {
            map[i.solution_id] = i;
        }
        for (const i of line_break) {
            map[i.solution_id] = Object.assign(map[i.solution_id], i);
        }
        return map;
    }

    async getUserConfirmInfo(user_id: string) {
        return await query("select confirmquestion, confirmanswer from users where user_id = ?", [user_id]);
    }
}

export default new UserService();
