import { submissionSolveMap } from "../ports/SubmissionSolveMap";

/** 做题关系图查询（HTTP 包装在 interfaces/http/controllers/SolveMapController）。 */
export class SolveMapUseCases {
    getUserList() {
        return submissionSolveMap.getUserListForRouter();
    }

    getTotalACList() {
        return submissionSolveMap.getTotalACList();
    }

    getUserACList(userId: string) {
        return submissionSolveMap.getUserACList(userId);
    }

    getSolveMap(problemId?: number | string) {
        return submissionSolveMap.getSolveMap(problemId);
    }
}

export default new SolveMapUseCases();
