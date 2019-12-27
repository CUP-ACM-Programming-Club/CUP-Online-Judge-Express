import SubmissionManager from "../submission/SubmissionManager";
import localJudger from "../../module/judger";
import Cacheable from "../../decorator/Cacheable";
import CachePool from "../../module/common/CachePool";

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
    addJudgeRequest(solutionId: number, superUser: boolean): Promise<void>;
}

export class JudgeManager implements IJudgeManager{
    @Cacheable(new CachePool(), 1, "month")
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
        let payload;
        const {problem_id} = payload = await SubmissionManager.getSolutionInfo(solutionId);
        Object.assign(submissionInfo, payload);
        if (problem_id <= 0) {
            submissionInfo.test_run = true;
            submissionInfo.custom_input = await SubmissionManager.getCustomInput(solutionId);
        }
        payload = await SubmissionManager.getProblemInfo(problem_id);
        Object.assign(submissionInfo, payload);
        submissionInfo.source = await SubmissionManager.getSourceBySolutionId(solutionId);
        return submissionInfo;
    }

    async addJudgeRequest(solutionId: number, superUser: boolean) {
        await localJudger.addTask(solutionId, superUser);
    }
}

export default new JudgeManager();
