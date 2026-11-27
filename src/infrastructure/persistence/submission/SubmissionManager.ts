import Cacheable from "../../../shared/cache/Cacheable";
import CachePool from "../../../shared/cache/CachePool";
import RetryAsync from "../../../shared/decorators/RetryAsync";
import {MySQLManager} from "../../db/mysql/MySQLManager";
import {RESULT_CHINESE_STRING} from "../../../domain/constants/result_chinese";
import {ExportSolutionInfo, SolutionInfoDAO} from "../../../application/ports/SubmissionSolutionRepository";

import { cachedQuery, LEGACY_CACHE_TTL_MS } from "../../db";

/** 与原 mysql_cache 相同的 2s 读缓存（本文件经它的 SQL 都不含 update/insert/delete 字样，旧外壳同样会缓存） */
const CACHE = { ttlMs: LEGACY_CACHE_TTL_MS };
const cache_query = (sql: string, params?: any[]) => cachedQuery<any>(sql, params, CACHE);

// 结果中文名与 DAO 类型现在定义在 domain / application 端口里，这里保留原有导出
export { RESULT_CHINESE_STRING };
export type { SolutionInfoDAO, ExportSolutionInfo };

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
}

export default new SubmissionManager();
