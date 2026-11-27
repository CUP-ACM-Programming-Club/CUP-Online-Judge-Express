/** 后台题目列表/上下架 SQL（从 application/services/admin/AdminProblemService 逐字搬来）。 */
import { query } from "../../db";
import { AdminProblemRepository } from "../../../application/ports/AdminProblemRepository";

export class MySqlAdminProblemRepository implements AdminProblemRepository {
    findPage(where: string, orderBy: string, offset: number, limit: number) {
        return query(`select * from problem ${[where, orderBy].join(" ")} limit ?,?`, [offset, limit]);
    }

    count(where: string, orderBy: string) {
        return query(`select count(1) as cnt from problem ${[where, orderBy].join(" ")}`);
    }

    findDefunct(problemId: number) {
        return query("select defunct from problem where problem_id = ?", [problemId]);
    }

    setDefunct(problemId: number, next: string) {
        return query("update problem set defunct = ? where problem_id = ?", [next, problemId]);
    }
}
