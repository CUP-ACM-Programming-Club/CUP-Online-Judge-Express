import Cacheable from "../../decorator/Cacheable";
import CachePool from "../../module/common/CachePool";
import ErrorLogger from "../../decorator/common/ErrorLogger";
import RetryAsync from "../../decorator/RetryAsync";
import {MySQLManager} from "../mysql/MySQLManager";
import {ErrorHandlerFactory} from "../../decorator/ErrorHandler";
import {ok} from "../../module/constants/state";
import {Request} from "express";

const cache_query = require("../../module/mysql_cache");

export const RESULT_CHINESE_STRING = [
    "等待",
    "等待重判",
    "编译中",
    "运行并评判",
    "答案正确",
    "格式错误",
    "答案错误",
    "时间超限",
    "内存超限",
    "输出超限",
    "运行错误",
    "编译错误",
    "编译成功",
    "运行完成",
    "已加入队列",
    "提交被拒绝",
    "系统错误",
    ""
]

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

export interface ExportSolutionInfo {
    user_id: string,
    problem_id: number,
    solution_id: number,
    nick: string,
    source: string,
    in_date: string,
    result: number,
    result_string?: string,
}

interface ProblemInfo {
    time_limit: number,
    memory_limit: number,
    spj: boolean | string | number
}

class SubmissionManager {
    // @RetryAsync(5, 500)
    // @ErrorLogger
    async getSourceBySolutionId(solutionId: number) {
        const response: any[] = await MySQLManager.execQuery("select source from source_code where solution_id = ?", [solutionId]);
        return response && response.length && response.length > 0 ? response[0].source : null;
    }

    // @Cacheable(new CachePool(), 1, "second")
    // @RetryAsync(5, 500)
    async getSolutionInfo(solutionId: number) {
        const response: any[] = await MySQLManager.execQuery("select * from solution where solution_id = ?", [solutionId]);
        return response && response.length && response.length > 0 ? response[0] as SolutionInfoDAO : null;
    }

    // @RetryAsync(5, 500)
    // @ErrorLogger
    async getCustomInput(solutionId: number) {
        const response: any[] | undefined = await MySQLManager.execQuery("select input_text from custominput where solution_id = ?", [solutionId]);
        if (response === undefined || response.length === 0) {
            return "";
        }
        return response[0].input_text || "";
    }

    // @RetryAsync(5, 500)
    // @ErrorLogger
    async getProblemInfo(problemId: number) {
        const response: any[] = await MySQLManager.execQuery("select time_limit, memory_limit, spj from problem where problem_id = ?", [Math.abs(problemId)]);
        const problemInfo: ProblemInfo = response[0];
        if (problemInfo) {
            if (problemInfo.time_limit <= 0) {
                problemInfo.time_limit = 1;
            }
            problemInfo.spj = !!parseInt(<string>problemInfo.spj);
        }
        return problemInfo;
    }

    async getSolutionExportInfoByUserId() {

    }

    async getSolutionExportInfoByContestId(contestId: number | string) {
        const exportInfoList: ExportSolutionInfo[] = await MySQLManager.execQuery("select * from (select * from solution where contest_id = ?)a left join source_code_user on source_code_user.solution_id = a.solution_id left join users on users.user_id = a.user_id", [contestId]);
        exportInfoList.sort((a, b) => {
            if (a.user_id !== b.user_id) {
                return a.user_id > b.user_id ? 1 : a.user_id === b.user_id ? 0 : -1;
            }
            else if (a.problem_id !== b.problem_id) {
                return a.problem_id - b.problem_id;
            }
            else {
                return a.solution_id - b.solution_id;
            }
        });
        return exportInfoList;
    }

    async getSolutionExportInfoByTopicId() {

    }

    @Cacheable(new CachePool<any>(), 1, "hour")
    async getSubmissionHourInfoCache() {
        const [submit, login] = await Promise.all([cache_query("select hour(in_date) as hour,count(hour(in_date)) as cnt from solution group by hour"),
            cache_query("select hour(time) as hour,count(hour(time)) as cnt from loginlog group by hour(time)")])
        return {
            submit,
            login
        }
    }

    @ErrorHandlerFactory(ok.okMaker)
    async getSubmissionHourInfo(req: Request) {
        return await this.getSubmissionHourInfoCache();
    }
}

export default new SubmissionManager();
