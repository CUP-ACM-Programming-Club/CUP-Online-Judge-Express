const cache_query = require("../../module/mysql_cache");

interface SolutionInfo {
    problem_id: number,
    user_id: string,
    language: number
}

interface ProblemInfo {
    time_limit: number,
    memory_limit: number,
    spj: number
}

class SubmissionManager {
    async getSourceBySolutionId(solutionId: number) {
        const response: any[] = await cache_query("select source from source_code where solution_id = ?", [solutionId]);
        return response[0].source;
    }

    async getSolutionInfo(solutionId: number) {
        const response: any[] = await cache_query("select problem_id, user_id, language from solution where solution_id = ?", [solutionId]);
        return response[0] as SolutionInfo;
    }

    async getCustomInput(solutionId: number) {
        const response: any[] = await cache_query("select input_text from custominput where solution_id = ?", [solutionId]);
        return response[0].input_text;
    }

    async getProblemInfo(solutionId: number) {
        const response: any[] = await cache_query("select time_limit, memory_limit, spj from problem where problem_id = ?", [Math.abs(solutionId)]);
        const problemInfo: ProblemInfo = response[0];
        if (problemInfo.time_limit <= 0) {
            problemInfo.time_limit = 1;
        }
        return problemInfo;
    }
}

export default new SubmissionManager();
