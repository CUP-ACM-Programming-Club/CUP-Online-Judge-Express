import query from "../../module/mysql_query";
import { rejudgeContest, rejudgeSolution, rejudgeProblem } from "../../module/status/update_solution_result";
import ProblemFileManager from "../../module/problem/ProblemFileManager";

class AdminProblemService {

    // Adapted from module/admin/list.ts
    async getProblemList(page: number, limit: number = 50, opts: any = {}) {
        let where = "", orderBy = "order by problem_id desc";
        if (opts.where && typeof opts.where === "string") {
            where = opts.where;
        }
        if (opts.order && typeof opts.order === "string") {
            orderBy = opts.order;
        }
        const offset = page * limit;
        const [data, count] = await Promise.all([
            query(`select * from problem ${[where, orderBy].join(" ")} limit ?,?`, [offset, limit]),
            query(`select count(1) as cnt from problem ${[where, orderBy].join(" ")}`)
        ]);

        return {
            data,
            count: count[0].cnt
        };
    }

    // Adapted from module/admin/defunct.ts
    async toggleProblemDefunct(problemId: number) {
        const res = await query("select defunct from problem where problem_id = ?", [problemId]);
        if (res.length > 0) {
            const current = res[0].defunct;
            const next = current === "Y" ? "N" : "Y";
            await query("update problem set defunct = ? where problem_id = ?", [next, problemId]);
            return next;
        }
    }

    // Rejudge wrappers
    async rejudgeContest(contestId: number) {
        return await rejudgeContest(contestId);
    }

    async rejudgeSolution(solutionId: number) {
        return await rejudgeSolution(solutionId);
    }

    async rejudgeProblem(problemId: number) {
        return await rejudgeProblem(problemId);
    }

    // Data Access
    getProblemDataPath(problemId: number, fileName: string) {
        return ProblemFileManager.getFilePath(problemId, fileName);
    }
}

export default new AdminProblemService();
