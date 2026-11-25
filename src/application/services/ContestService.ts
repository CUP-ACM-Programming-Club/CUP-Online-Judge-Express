
import { Viewer, ViewerWithQuery } from "../../domain/policy/Viewer";
import dayjs from "dayjs";
import { error, ok } from "../../domain/constants/state";
import { ContestListCriteria, contestRepository } from "../ports/ContestRepository";
import { contestCache as ContestCachePool } from "../ports/ContestCache";
import HttpError from "../../domain/errors/HttpError";
import { ErrorHandlerFactory } from "../../shared/decorators/ErrorHandler";
import { assertCanViewContest, canBrowseSource, canManageContest, canSeeHiddenContests, isAdmin } from "../../domain/policy/predicates";

function safeArrayParse(array: any[] | any) {
    if (typeof array !== "object" && !array.length) {
        return [];
    }
    return array.length ? array : Object.keys(array);
}

/**
 * 从请求推导比赛列表的筛选条件（顺序与原 ContestManager 一致：权限 → 我的比赛 → 搜索 → 页码）。
 * 「我的比赛」= session.contest_maker 与 session.contest 的键去掉首字母（m / c）。
 */
export function buildContestListCriteria(req: ViewerWithQuery): ContestListCriteria {
    const canSeeHidden = canSeeHiddenContests(req);
    // @ts-ignore
    const contestMode = !!global.contest_mode;
    const admin = isAdmin(req);
    let myContestIds: string[] | null = null;
    if (req.query.myContest) {
        myContestIds = safeArrayParse(req.session!.contest_maker).concat(safeArrayParse(req.session!.contest)).map((el: any) => el.substring(1));
    }
    const search = typeof req.query.search === "string" ? req.query.search : null;
    return { canSeeHidden, isAdmin: admin, contestMode, myContestIds, search, page: req.query.page };
}

class ContestService {

    @ErrorHandlerFactory(ok.okMaker)
    async getContestList(req: ViewerWithQuery) {
        return await contestRepository.listContests(buildContestListCriteria(req));
    }

    @ErrorHandlerFactory(ok.okMaker)
    async getContestListAsObject(req: ViewerWithQuery) {
        let resultList: any;
        let resultCount: any;
        // contestInfoList 是 getContestList 包装后的 {status, data}（原样保留）
        [resultList, resultCount] = await Promise.all([this.getContestList(req), contestRepository.countContests(buildContestListCriteria(req))]);
        return {
            contestInfoList: resultList,
            total: resultCount
        }
    }

    @ErrorHandlerFactory(ok.okMaker)
    private async findAllContests() {
        return await contestRepository.findAllContests();
    }

    async getAllContestList(req: Viewer) {
        // 包装成 { status: "OK", data: [...] }（ErrorHandlerFactory(ok.okMaker)）
        const result: any = await this.findAllContests();
        if (canSeeHiddenContests(req)) {
            return result;
        }
        // same visibility rule as the paged contest list: hidden contests are for admins / contest managers only
        if (result && Array.isArray(result.data)) {
            return { ...result, data: result.data.filter((contest: any) => contest.defunct === "N") };
        }
        return result;
    }

    @ErrorHandlerFactory(ok.okMaker)
    async getTotalNumber(req: ViewerWithQuery) {
        return await contestRepository.countAllMatching(buildContestListCriteria(req));
    }

    /**
     * Check if a contest exists and if the user has access to it.
     * Returns the contest detail if accessible.
     * Throws HttpError if not accessible or invalid.
     */
    async checkContestAccess(req: Viewer, cid: number) {
        if (isNaN(cid) || cid < 1000) {
            throw new HttpError("Invalid Contest ID", 400);
        }

        const contest = await contestRepository.findContestById(cid);
        if (!contest || contest.length === 0) {
            throw new HttpError("Contest not found", 404);
        }

        const contestDetail = contest[0];
        // 判定规则见 src/policy/predicates.ts assertCanViewContest（admin | maker 豁免、contest_mode、隐藏、未开始、私有）
        await assertCanViewContest(req, contestDetail, cid);
        return contestDetail;
    }

    async getContestGeneralDetail(cid: number) {
        const cacheKey = `Contest:info:${cid}`;
        const cache = await ContestCachePool.get(cacheKey);
        if (cache) {
            return cache.data;
        }

        const contest_general_detail = await contestRepository.findContestGeneralDetail(cid);

        if (contest_general_detail.length < 1) {
            throw new HttpError("Contest not found", 404, error.invalidParams);
        }

        ContestCachePool.set(cacheKey, contest_general_detail[0]);
        return contest_general_detail[0];
    }

    async getContestProblemList(req: Viewer, cid: number) {
        const contestDetail = await this.checkContestAccess(req, cid);

        const contest_is_end = dayjs(contestDetail.end_time).isBefore(dayjs());
        let contestProblemList: any[] = [];

        // Fetch Problems (Cached)
        // This query matches the complicated logic in module/contest/problem.js
        const vjudge = contestDetail.vjudge;
        contestProblemList = await contestRepository.findContestProblems(cid, !!vjudge);

        // Fetch User Submission Status (Uncached/Short Cache?) - User specific
        // We only need to know if they AC'd or attempted
        const submission_data = await contestRepository.findUserSubmissionSummary(req.session!.user_id, cid);

        const limit_data = await contestRepository.findContestLimitHostname(cid);

        // Merge User Status
        const submission_map: any = {};
        for (const sub of submission_data) {
            if (!submission_map[sub.problem_id]) {
                submission_map[sub.problem_id] = { ac: false };
            }
            if (sub.result === 4) submission_map[sub.problem_id].ac = true;
        }

        for (const prob of contestProblemList) {
            const status = submission_map[prob.pid];
            if (status) {
                prob.ac = status.ac ? 1 : -1;
            } else {
                prob.ac = 0;
            }
        }

        const browse_privilege = await canManageContest(req, cid);

        if (!browse_privilege && !contest_is_end) {
            // Mask PIDs during contest
            for (const prob of contestProblemList) {
                prob.pid = prob.pid1 = prob.pid2 = "";
            }
        }

        delete contestDetail.password; // Security

        return {
            status: "OK",
            data: contestProblemList,
            info: contestDetail,
            admin: browse_privilege,
            limit: limit_data[0].limit_hostname,
            // @ts-ignore
            contest_mode: global.contest_mode
        };
    }

    async getContestStatistics(req: Viewer, cid: number) {
        if (isNaN(cid) || cid < 1000) {
            throw new HttpError("Invalid Contest ID", 400, error.invalidParams);
        }

        // 与比赛详情同一门禁（修复：之前私有 / 隐藏 / 未开始比赛的统计任何登录用户都能看）。
        // 前端只在比赛内的状态页调用，能进比赛的人不受影响。
        await this.checkContestAccess(req, cid);

        const [contest_statistics_detail, total] = await Promise.all([
            contestRepository.findContestStatistics(cid),
            contestRepository.countContestProblems(cid)
        ]);

        return {
            status: "OK",
            data: contest_statistics_detail,
            total: total[0].total_problem
        };
    }

    async checkPassword(req: Viewer, cid: number, password: string) {
        if (isNaN(cid) || cid < 1000) {
            throw new HttpError("Invalid Contest ID", 400, error.invalidParams);
        }

        const contest_detail = await contestRepository.findContestForPassword(cid);
        if (contest_detail.length < 1) {
            throw new HttpError("Contest not found", 404, error.invalidParams);
        }

        const realPassword = contest_detail[0].password;
        if (realPassword && realPassword.length > 0 && realPassword.toString() === password.toString()) {
            req.session!.contest[`c${cid}`] = true;

            // Async privilege update
            contestRepository.grantContestPrivilege(req.session!.user_id, cid);

            return { status: "OK" };
        } else {
            throw new HttpError("Wrong password", 200, error.errorMaker("Wrong password"));
        }
    }
    async getContestProblemDetails(req: Viewer, cid: number, pid: number, sid?: number) {
        const [contest, result] = await Promise.all([
            contestRepository.findContestById(cid),
            contestRepository.findContestProblem(cid, pid)
        ]);

        if (!contest || contest.length === 0) {
            throw new HttpError("Contest not found", 404);
        }

        // 与比赛题目列表（getContestProblemList）同一套可见性判断：开始时间、隐藏、私有、比赛模式。
        // 之前这里只检查了比赛模式和私有，公开比赛在开始前 / 隐藏时可以直接读到题面。
        await this.checkContestAccess(req, cid);

        if (result.length > 0) {
            if (result[0].oj_name && result[0].oj_name.length > 0) {
                return {
                    redirect: true,
                    url: `${result[0].oj_name.toLowerCase()}submitpage.php?cid=${cid}&pid=${pid}`
                };
            }
            let { langmask, end_time, limit_hostname } = contest[0];
            let problem_id = result[0].problem_id;

            // To avoid circular dependency with ProblemService if we import entire service,
            // we might need to handle this carefully.
            // But ProblemService is already imported or can be imported. 
            const ProblemService = require("./ProblemService").default;

            return await ProblemService.getProblem(req, {
                id: problem_id,
                cid,
                pid,
                source: result[0].oj_name || "",
                langmask,
                after_contest: dayjs().isAfter(dayjs(end_time)),
                limit_hostname,
                solution_id: sid
            });
        } else {
            throw error.invalidParams;
        }
    }
}

export default new ContestService();
