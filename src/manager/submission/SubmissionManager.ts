import Cacheable from "../../decorator/Cacheable";
import CachePool from "../../module/common/CachePool";
import ErrorLogger from "../../decorator/common/ErrorLogger";

const cache_query = require("../../module/mysql_cache");

export interface SolutionInfoDAO {
    problem_id: number,
    user_id: string,
    language: number
    solution_id: number,
    time: number,
    memory: number,
    in_date: string,
    result: number,
    ip: string,
    contest_id: number,
    topic_id: number,
    valid: number,
    pass_point: number,
    num: number,
    code_length: number,
    judgetime: string,
    pass_rate: number,
    judger: string,
    share: number,
    fingerprint: string,
    fingerprintRaw: string
}

interface ProblemInfo {
    time_limit: number,
    memory_limit: number,
    spj: boolean | string | number
}

class SubmissionManager {
    // @Retry(5)
    async getSourceBySolutionId(solutionId: number) {
        const response: any[] = await cache_query("select source from source_code where solution_id = ?", [solutionId]);
        return response[0].source;
    }

    @Cacheable(new CachePool(), 1, "second")
    // @Retry(5)
    async getSolutionInfo(solutionId: number) {
        const response: any[] = await cache_query("select * from solution where solution_id = ?", [solutionId]);
        return response[0] as SolutionInfoDAO;
    }

    // @Retry(5)
    @ErrorLogger
    async getCustomInput(solutionId: number) {
        const response: any[] = await cache_query("select input_text from custominput where solution_id = ?", [solutionId]);
        return response[0].input_text;
    }

    // @Retry(5)
    async getProblemInfo(problemId: number) {
        const response: any[] = await cache_query("select time_limit, memory_limit, spj from problem where problem_id = ?", [Math.abs(problemId)]);
        const problemInfo: ProblemInfo = response[0];
        if (problemInfo.time_limit <= 0) {
            problemInfo.time_limit = 1;
        }
        problemInfo.spj = !!parseInt(<string>problemInfo.spj);
        return problemInfo;
    }


}

export default new SubmissionManager();
