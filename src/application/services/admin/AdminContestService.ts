import { adminContestRepository } from "../../ports/AdminContestRepository";
import ProblemSetCachePool from "../../problemset/ProblemSetCachePool";
import { contestCache as ContestCachePool } from "../../ports/ContestCache";
import { ConfigManager } from "../../ports/Config";
import dayjs from "dayjs";
import {
    addContestCompetitorWithTransaction,
    addContestProblemWithTransaction,
    removeAllCompetitorPrivilegeWithTransaction,
    removeAllContestProblemWithTransaction,
    trimProperty,
    removeAllContestProblem,
    addContestProblem,
    removeAllCompetitorPrivilege,
    addContestCompetitor
} from "../../util";
import isNumber from "../../../shared/isNumber";

class AdminContestService {

    // Adapted from module/admin/list.ts
    async getContestList(page: number, limit: number = 50, opts: any = {}) {
        let where = "", orderBy = "order by contest_id desc";
        if (opts.where && typeof opts.where === "string") {
            where = opts.where;
        }
        if (opts.order && typeof opts.order === "string") {
            orderBy = opts.order;
        }
        const offset = page * limit;
        const [data, count] = await Promise.all([
            adminContestRepository.findContestPage(where, orderBy, offset, limit),
            adminContestRepository.countContests(where, orderBy)
        ]);

        return {
            data,
            count: count[0].cnt
        };
    }

    // Adapted from module/admin/defunct.ts
    async toggleContestDefunct(contestId: number) {
        const res = await adminContestRepository.findContestDefunct(contestId);
        if (res.length > 0) {
            const current = res[0].defunct;
            const next = current === "Y" ? "N" : "Y";
            await adminContestRepository.updateContestDefunct(contestId, next);
            return next;
        }
    }

    private timeToString(time: any) {
        return dayjs(time).format("YYYY-MM-DD HH:mm:ss");
    }

    // Adapted from routes/admin/contest/add.ts
    async createContest(data: any, userId: string) {
        let { ContestMode, Public, classroomSelected, title, defunct, description, hostname, langmask } = trimProperty(data);
        let { startTime, endTime, password, problemSelected, userList, showAllRanklist, showSim } = trimProperty(data);
        startTime = this.timeToString(startTime);
        endTime = this.timeToString(endTime);
        if (!hostname || hostname === "null") {
            hostname = "";
        }
        defunct = defunct ? "Y" : "N"; // Align with existing logic

        const response = await adminContestRepository.insertContest({
            title, startTime, endTime, private: Public ? "0" : "1", langmask, description, password, ipPolicy: classroomSelected, cmodVisible: ContestMode,
            limitHostname: hostname, defunct, showAllRanklist, showSim
        }, userId);
        const contest_id = response.insertId;

        // Non-transactional logic from add.ts (could be improved to transaction, but keeping consistent for now)
        await removeAllContestProblem(contest_id);
        await addContestProblem(contest_id, problemSelected);
        await removeAllCompetitorPrivilege(contest_id);
        await addContestCompetitor(contest_id, userList);

        ProblemSetCachePool.removeAll();
        ContestCachePool.removeAll();
        return contest_id;
    }

    // Adapted from routes/admin/contest/edit.ts
    async updateContest(contestId: number, data: any) {
        const connection = await adminContestRepository.openConnection();
        try {
            await connection.beginTransaction();
            let { ContestMode, Public, classroomSelected, title, defunct, description, hostname, langmask } = trimProperty(data);
            let { startTime, endTime, password, problemSelected, userList, showAllRanklist, showSim } = trimProperty(data);

            let defaultLangmask = ConfigManager.getConfig("default_langmask", "0");
            if (isNumber(defaultLangmask)) {
                defaultLangmask = parseInt(defaultLangmask);
                langmask ^= defaultLangmask;
            }

            startTime = this.timeToString(startTime);
            endTime = this.timeToString(endTime);
            if (!hostname || hostname === "null") {
                hostname = "";
            }
            defunct = defunct ? "Y" : "N";

            await adminContestRepository.updateContest(connection, contestId, {
                title, description, startTime, endTime, private: Public ? "0" : "1", langmask, limitHostname: hostname, password, cmodVisible: ContestMode,
                ipPolicy: classroomSelected, defunct, showAllRanklist, showSim
            });

            await removeAllContestProblemWithTransaction(connection, contestId);
            await addContestProblemWithTransaction(connection, contestId, problemSelected);
            await removeAllCompetitorPrivilegeWithTransaction(connection, contestId);
            await addContestCompetitorWithTransaction(connection, contestId, userList);

            await connection.commit();
            ProblemSetCachePool.removeAll();
            ContestCachePool.removeAll();
        } catch (e) {
            await connection.rollback();
            throw e;
        } finally {
            connection.release();
            connection.release();
        }
    }

    async getContestCompetitors(contestId: number | string) {
        return await adminContestRepository.findContestCompetitors(contestId);
    }
}

export default new AdminContestService();
