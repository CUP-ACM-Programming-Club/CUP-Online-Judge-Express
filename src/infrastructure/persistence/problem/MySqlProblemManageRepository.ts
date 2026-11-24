/** 题目创建/修改/导入的写库 SQL（从 application/services/ProblemManageService 逐字搬来）。 */
import { ProblemManageRepository, ProblemUpdateFields } from "../../../application/ports/ProblemManageRepository";

const query = require("../../db/legacy/mysql_query");

const checkEmpty = (str: any) => {
    if (str === "" || str === null || str === undefined) {
        return 0;
    }
    return str;
};

export class MySqlProblemManageRepository implements ProblemManageRepository {
    insertProblem(problemId: number | undefined, sqlValues: any[]) {
        if (problemId) {
            return query(`INSERT INTO problem (problem_id,title,description,input,output,
            sample_input,sample_output,spj,hint,source,label,in_date,time_limit,memory_limit,
            defunct,accepted,submit,solved)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,NOW(),?,?,?,?,?,?)
            `, [problemId, ...sqlValues]);
        }
        return query(`INSERT INTO problem (title,description,input,output,
            sample_input,sample_output,spj,hint,source,label,in_date,time_limit,memory_limit,
            defunct,accepted,submit,solved)
            VALUES(?,?,?,?,?,?,?,?,?,?,NOW(),?,?,?,?,?,?)
            `, sqlValues);
    }

    deleteProblemPrivilege(problemId: any) {
        return query("DELETE FROM privilege where rightstr = ?", [`p${problemId}`]);
    }

    insertProblemPrivilege(userId: any, problemId: any) {
        return query("INSERT INTO privilege (user_id,rightstr,defunct) values(?,?,?)", [userId, `p${problemId}`, "N"]);
    }

    insertPrefile(pid: number, prepend: number, code: string, lang: number) {
        return query("insert into prefile (problem_id,prepend,code,type) VALUES(?,?,?,?)", [pid, prepend, code, lang]);
    }

    insertStandardSolution(pid: number, language: number, userId: any, codeLength: number) {
        return query(`INSERT INTO solution(problem_id,language,user_id,in_date,code_length,ip)
            VALUES(?,?,?,NOW(),?,'127.0.0.1')`, [pid, language, userId, codeLength]);
    }

    insertSourceCode(solution_id: any, source: string) {
        return query("INSERT INTO source_code(solution_id,source)VALUES(?,?)", [solution_id, source]);
    }

    insertSourceCodeUser(solution_id: any, source: string) {
        return query("INSERT INTO source_code_user(solution_id,source)VALUES(?,?)", [solution_id, source]);
    }

    findMaxProblemIdRows() {
        return query("SELECT max(problem_id) as max_id FROM problem");
    }

    updateProblem(local: boolean, problemId: number, source: string, json: ProblemUpdateFields) {
        let sql = `update ${local ? "" : "vjudge_"}problem set title = ?,time_limit = ?,
        memory_limit = ?,description = ?,input = ?,output = ?,
        sample_input = ?,sample_output = ?,label = ?${local ? " ,hint = ?, spj = ? " : ""} where problem_id = ?
         ${local ? "" : " and source = ?"}`;

        let sqlArr = [json.title, checkEmpty(json.time), checkEmpty(json.memory), json.description, json.input,
        json.output, json.sampleinput, json.sampleoutput, json.label];

        if (local) {
            sqlArr.push(json.hint, json.spj, problemId);
        } else {
            sqlArr.push(problemId, source);
        }

        return query(sql, sqlArr);
    }
}
