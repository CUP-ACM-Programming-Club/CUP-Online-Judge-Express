import { MySQLManager, MySQLTransaction } from "../../db/mysql/MySQLManager";
import { SubmissionSubmitRepository, SubmitTransaction } from "../../../application/ports/SubmissionSubmitRepository";

import cache_query = require("../../db/legacy/mysql_cache");

/** 提交事务：包装 MySQLManager.transaction() 的连接，SQL 自 SubmissionService 原样搬来。 */
class MySqlSubmitTransaction implements SubmitTransaction {
    constructor(private connection: MySQLTransaction) {}

    findContestLimitHostname(contest_id: number) {
        return this.connection.query("select limit_hostname from contest where contest_id = ?", [contest_id]);
    }

    findContestIpPolicy(contest_id: number) {
        return this.connection.query("select ip_policy from contest where contest_id = ?", [contest_id]);
    }

    insertProblemSolution(problemId: number, userId: string, language: number, IP: string, code_length: number, share: boolean, judger: string, fingerprint: any, fingerprintRaw: any) {
        return this.connection.query(`insert into solution(problem_id,user_id,in_date,language,ip,code_length,share,judger,fingerprint,fingerprintRaw)
        values(?,?,NOW(),?,?,?,?,?,?,?)`, [problemId, userId, language, IP, code_length, share, judger, fingerprint, fingerprintRaw]);
    }

    insertContestSolution(problemId: number, userId: string, language: number, IP: string, code_length: number, contestId: number, num: number, judger: string, fingerprint: any, fingerprintRaw: any) {
        return this.connection.query(`INSERT INTO solution(problem_id,user_id,in_date,language,ip,code_length,contest_id,num,judger,fingerprint,fingerprintRaw)
        values(?,?,NOW(),?,?,?,?,?,?,?,?)`, [problemId, userId, language, IP, code_length, contestId, num, judger, fingerprint, fingerprintRaw]);
    }

    insertTopicSolution(problemId: number, userId: string, language: number, IP: string, code_length: number, topicId: number, num: number, judger: string, fingerprint: any, fingerprintRaw: any) {
        return this.connection.query(`insert into solution(problem_id,user_id,in_date,language,ip,code_length,topic_id,num,judger,fingerprint,fingerprintRaw)
        values(?,?,NOW(),?,?,?,?,?,?,?,?)`, [problemId, userId, language, IP, code_length, topicId, num, judger, fingerprint, fingerprintRaw]);
    }

    insertSourceCodeUser(solution_id: number, source_code_user: string, hash: string) {
        return this.connection.query(`insert into source_code_user(solution_id,source,hash)
        values(?,?,?)`, [solution_id, source_code_user, hash]);
    }

    insertSourceCode(solution_id: number, source_code: string) {
        return this.connection.query(`insert into source_code(solution_id, source)
        values(?,?)`, [solution_id, source_code]);
    }

    insertCustomInput(solution_id: number, input_text: string) {
        return this.connection.query(`insert into custominput(solution_id, input_text)
            values(?,?)`, [solution_id, input_text]);
    }

    commit() {
        return this.connection.query("COMMIT");
    }

    rollback() {
        return this.connection.query("ROLLBACK");
    }

    release() {
        return this.connection.release();
    }
}

/** 提交时的 SQL（自 application/services/SubmissionService 原样搬来）。 */
export class MySqlSubmissionSubmitRepository implements SubmissionSubmitRepository {
    async beginTransaction(): Promise<SubmitTransaction> {
        return new MySqlSubmitTransaction(await MySQLManager.transaction());
    }

    findOngoingOrFutureContestsOfProblem(problem_id: number) {
        return cache_query(`select contest_id,start_time,end_time from contest where
    contest_id in (select contest_id from contest_problem where problem_id = ?)
    and end_time > NOW()`, [problem_id]);
    }

    findContestTime(contest_id: number) {
        return cache_query("select start_time,end_time from contest where contest_id = ?", [contest_id]);
    }

    findContestLangmask(contest_id: number) {
        return cache_query(`select langmask from contest 
        where contest_id = ?`, [contest_id]);
    }

    findTopicLangmask(topic_id: number) {
        return cache_query(`select langmask from special_subject 
        where topic_id = ?`, [topic_id]);
    }

    findContestVisibility(contest_id: number) {
        return cache_query("select private,defunct from contest where contest_id = ?", [contest_id]);
    }

    findTopicVisibility(topic_id: number) {
        return cache_query("select private,defunct from special_subject where topic_id = ?", [topic_id]);
    }

    findContestProblem(contest_id: number, num: number) {
        return cache_query(`select problem_id from contest_problem
         where contest_id = ? and num = ?`, [contest_id, num]);
    }

    findTopicProblem(topic_id: number, num: number) {
        return cache_query(`select problem_id from special_subject_problem
         where topic_id = ? and num = ?`, [topic_id, num]);
    }

    findProblemDefunct(problem_id: number) {
        return cache_query("select defunct from problem where problem_id = ?", [problem_id]);
    }

    findPrefiles(problem_id: number, language: number) {
        return cache_query("select * from prefile where problem_id = ? and type = ?", [problem_id, language]);
    }
}
