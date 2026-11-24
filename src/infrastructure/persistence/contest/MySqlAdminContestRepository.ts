import { AdminContestRepository, ContestRow, ContestTxConnection } from "../../../application/ports/AdminContestRepository";
import { MySQLManager } from "../../db/mysql/MySQLManager";
import query = require("../../db/legacy/mysql_query");

/** 后台比赛管理的 SQL。逐字搬自原 application/services/admin/AdminContestService。 */
export class MySqlAdminContestRepository implements AdminContestRepository {
    findContestPage(where: string, orderBy: string, offset: number, limit: number) {
        return query(`select * from contest ${[where, orderBy].join(" ")} limit ?,?`, [offset, limit]);
    }

    countContests(where: string, orderBy: string) {
        return query(`select count(1) as cnt from contest ${[where, orderBy].join(" ")}`);
    }

    findContestDefunct(contestId: number) {
        return query("select defunct from contest where contest_id = ?", [contestId]);
    }

    updateContestDefunct(contestId: number, defunct: string) {
        return query("update contest set defunct = ? where contest_id = ?", [defunct, contestId]);
    }

    insertContest(row: ContestRow, maker: string) {
        let sql = `insert into contest(title, start_time, end_time, private, langmask, description, password, vjudge,
    ip_policy, cmod_visible, limit_hostname,defunct,maker,show_all_ranklist, show_sim) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

        return query(sql, [row.title, row.startTime, row.endTime, row.private, row.langmask, row.description, row.password, 0, row.ipPolicy, row.cmodVisible,
            row.limitHostname, row.defunct, maker, row.showAllRanklist, row.showSim]);
    }

    async openConnection(): Promise<ContestTxConnection> {
        const rawConnection = await MySQLManager.getConnection();
        return (rawConnection as any).promise();
    }

    updateContest(connection: ContestTxConnection, contestId: number, row: ContestRow) {
        let sql = `update contest set title = ?,description = ?, start_time = ?, end_time = ?, private = ?, langmask = ?,
        limit_hostname = ?, password = ?, vjudge = 0, cmod_visible = ?, ip_policy = ?, defunct = ?,
        show_all_ranklist = ?, show_sim = ? where contest_id = ?`;

        return connection.query(sql, [row.title, row.description, row.startTime, row.endTime, row.private, row.langmask, row.limitHostname, row.password, row.cmodVisible, row.ipPolicy,
            row.defunct, row.showAllRanklist, row.showSim, contestId]);
    }

    findContestCompetitors(contestId: number | string) {
        return query("select user_id from privilege where rightstr = ?", [`c${contestId}`]);
    }
}

export default new MySqlAdminContestRepository();
