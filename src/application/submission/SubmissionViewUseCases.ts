import { submissionQueryRepository } from "../ports/SubmissionQueryRepository";
import { submissionSourcePrivilege } from "../ports/SubmissionSourcePrivilege";
import { submissionExportRepository } from "../ports/SubmissionExportRepository";

/**
 * 源码查看、ACM 队员提交列表、提交时段统计、rpk 导出取数等只读用例，供 interfaces 的路由调用。
 */
export class SubmissionViewUseCases {
    /** 源码查看权限（admin / source_browser / 所属比赛助教），10 秒缓存 */
    checkSourcePrivilege(session: any, solutionId: number) {
        return submissionSourcePrivilege.checkPrivilege(session, solutionId);
    }

    /** 源码查看：返回 [提交与源码行, vjudge 时的 oj_name 行] */
    async getSourceView(local: boolean, solutionId: number, browseCode: boolean, userId: any) {
        let promiseArray = [];
        promiseArray.push(submissionQueryRepository.findSourceView(local, solutionId, browseCode, userId));
        if (!local) {
            promiseArray.push(submissionQueryRepository.findVjudgeOjName(solutionId));
        }
        return await Promise.all(promiseArray);
    }

    getRecentAcmSubmissions(userId?: string) {
        return submissionQueryRepository.findRecentAcmSubmissions(userId);
    }

    getSubmissionHourInfo() {
        return submissionQueryRepository.getSubmissionHourInfo();
    }

    getProblemForExport(problemId: any) {
        return submissionExportRepository.findProblem(problemId);
    }

    getFastestSolutionForExport(problemId: any) {
        return submissionExportRepository.findFastestSolution(problemId);
    }

    getPrefilesForExport(problemId: any) {
        return submissionExportRepository.findPrefiles(problemId);
    }

    getContestProblemsForExport(contestId: number) {
        return submissionExportRepository.findContestProblems(contestId);
    }
}

export default new SubmissionViewUseCases();
