import query from "../../module/mysql_query";
import { MySQLManager } from "../../manager/mysql/MySQLManager";
import ProblemSetCachePool from "../../module/problemset/ProblemSetCachePool";
import ContestCachePool from "../../module/contest/ContestCachePool";
import { ConfigManager } from "../../module/config/config-manager";
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
} from "../../module/util";
import isNumber from "../../module/util/isNumber";

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
            query(`select * from contest ${[where, orderBy].join(" ")} limit ?,?`, [offset, limit]),
            query(`select count(1) as cnt from contest ${[where, orderBy].join(" ")}`)
        ]);

        return {
            data,
            count: count[0].cnt
        };
    }

    // Adapted from module/admin/defunct.ts
    async toggleContestDefunct(contestId: number) {
        const res = await query("select defunct from contest where contest_id = ?", [contestId]);
        if (res.length > 0) {
            const current = res[0].defunct;
            const next = current === "Y" ? "N" : "Y";
            await query("update contest set defunct = ? where contest_id = ?", [next, contestId]);
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

        let sql = `insert into contest(title, start_time, end_time, private, langmask, description, password, vjudge,
    ip_policy, cmod_visible, limit_hostname,defunct,maker,show_all_ranklist, show_sim) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

        const response = await query(sql, [title, startTime, endTime, Public ? "0" : "1", langmask, description, password, 0, classroomSelected, ContestMode,
            hostname, defunct, userId, showAllRanklist, showSim]);
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
        const rawConnection = await MySQLManager.getConnection();
        const connection = (rawConnection as any).promise();
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

            let sql = `update contest set title = ?,description = ?, start_time = ?, end_time = ?, private = ?, langmask = ?,
        limit_hostname = ?, password = ?, vjudge = 0, cmod_visible = ?, ip_policy = ?, defunct = ?,
        show_all_ranklist = ?, show_sim = ? where contest_id = ?`;

            await connection.query(sql, [title, description, startTime, endTime, Public ? "0" : "1", langmask, hostname, password, ContestMode, classroomSelected,
                defunct, showAllRanklist, showSim, contestId]);

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
        return await query("select user_id from privilege where rightstr = ?", [`c${contestId}`]);
    }
}

export default new AdminContestService();
