/** 前置/后置代码（prefile 表）SQL（原 PrependAppendManager 的数据访问部分）。 */
import { PrefileCode, PrefileRow, ProblemPrefileRepository } from "../../../application/ports/ProblemPrefileRepository";

const query = require("../../db/legacy/mysql_cache");

export class MySqlProblemPrefileRepository implements ProblemPrefileRepository {
    findByProblem(problemId: number | string, prepend: number): Promise<PrefileRow[]> {
        return query(`select problem_id, prepend, code, type from prefile where problem_id = ? and prepend = ?`, [problemId, prepend]);
    }

    insert(problemId: number | string, prepend: number, e: PrefileCode) {
        return query(`insert into prefile(problem_id, prepend, code, type) values (?,?,?,?)`,
            [problemId, prepend, e.code, e.language]);
    }

    deleteByProblem(problemId: number | string, prepend: number) {
        return query(`delete from prefile where problem_id = ? and prepend = ?`, [problemId, prepend]);
    }
}
