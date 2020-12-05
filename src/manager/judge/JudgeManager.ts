import SubmissionManager from "../submission/SubmissionManager";
import localJudger from "../../module/judger";
import {error} from "../../module/constants/state";
import Logger from "../../module/console/Logger";

interface ISubmissionInfo {
    solution_id: number,
    source: string,
    custom_input: string | undefined | null,
    test_run: boolean,
    language: number,
    user_id: string,
    problem_id: number,
    spj: boolean,
    time_limit: number,
    memory_limit: number
}

interface IJudgeManager {
    buildSubmissionInfo(solutionId: number): Promise<ISubmissionInfo>;
    addJudgeRequest(solutionId: number, superUser: boolean): Promise<boolean>;
}

export class JudgeManager implements IJudgeManager{

    checkNotNull(obj: any, solutionId: number) {
        if (obj === null || obj === undefined) {
            throw Object.assign(error.errorMaker("db error.Please contact the administrator."), {noRetry: true, solutionId});
        }
    }

    async buildSubmissionInfo(solutionId: number) {
        const submissionInfo: ISubmissionInfo = {
            solution_id: solutionId,
            source: "",
            custom_input: "",
            test_run: false,
            language: 0,
            user_id: "",
            problem_id: 0,
            spj: false,
            time_limit: 0,
            memory_limit: 0
        };
        let solutionInfo: any = await SubmissionManager.getSolutionInfo(solutionId);
        Logger.log("Get solutionInfo: ", solutionId);
        this.checkNotNull(solutionInfo, solutionId);
        Logger.log("SolutionInfo: ", solutionInfo);
        const {problem_id} = solutionInfo;
        Object.assign(submissionInfo, solutionInfo);
        if (problem_id <= 0) {
            submissionInfo.test_run = true;
            submissionInfo.custom_input = await SubmissionManager.getCustomInput(solutionId);
        }
        const problemInfo = await SubmissionManager.getProblemInfo(problem_id);
        this.checkNotNull(problemInfo, solutionId);
        Object.assign(submissionInfo, problemInfo);
        submissionInfo.source = await SubmissionManager.getSourceBySolutionId(solutionId);
        this.checkNotNull(submissionInfo.source, solutionId);
        return submissionInfo;
    }

    async addJudgeRequest(solutionId: number, superUser: boolean) {
        return await localJudger.addTask(solutionId, superUser);
    }
}

export default new JudgeManager();
