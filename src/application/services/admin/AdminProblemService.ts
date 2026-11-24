import { rejudgeContest, rejudgeSolution, rejudgeProblem } from "../../status/update_solution_result";
import { adminProblemRepository } from "../../ports/AdminProblemRepository";
import { problemDataStorage } from "../../ports/ProblemDataStorage";

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
            adminProblemRepository.findPage(where, orderBy, offset, limit),
            adminProblemRepository.count(where, orderBy)
        ]);

        return {
            data,
            count: count[0].cnt
        };
    }

    // Adapted from module/admin/defunct.ts
    async toggleProblemDefunct(problemId: number) {
        const res = await adminProblemRepository.findDefunct(problemId);
        if (res.length > 0) {
            const current = res[0].defunct;
            const next = current === "Y" ? "N" : "Y";
            await adminProblemRepository.setDefunct(problemId, next);
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
        return problemDataStorage.getFilePath(problemId, fileName);
    }
}

export default new AdminProblemService();
