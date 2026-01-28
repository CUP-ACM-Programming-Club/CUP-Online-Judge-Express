import { MySQLManager, MySQLTransaction } from "../manager/mysql/MySQLManager";
import Logger from "../module/console/Logger";
import ContestManager from "../manager/contest/ContestManager";
import ContestAssistantManager from "../manager/contest/ContestAssistantManager";
import { SubmissionData, SubmissionResponse } from "../types/SubmissionType";
import { SubmissionType, ProblemPublicStatus } from "../enums/SubmissionEnums";
import { Request } from "express";

import cache_query = require("../module/mysql_cache");
const const_variable = require("../module/const_name");
const dayjs = require("dayjs");
const client = require("../module/redis").default;
const detectClassroom = require("../module/detect_classroom");
const getIP = require("../module/getIP");
const [error] = require("../module/const_var");
const crypto = require("crypto");
const login_action = require("../module/login_action");

export class SubmissionService {
    private readonly LANGMASK = const_variable.langmask;

    private deepCopy(obj: any): any {
        return JSON.parse(JSON.stringify(obj));
    }

    private createCodeHash(source_code: string): string {
        const hash = crypto.createHash("md5");
        return hash.update(source_code).digest("hex");
    }

    private dos2unix(plainText: any) {
        if (typeof plainText !== "string") {
            throw new Error("input should be string");
        }
        return plainText.split("\r\n").join("\n");
    }

    private async problemInFutureOrCurrentContest(problem_id: number) {
        const data = await cache_query(`select contest_id,start_time,end_time from contest where
    contest_id in (select contest_id from contest_problem where problem_id = ?)
    and end_time > NOW()`, [problem_id]);
        return (data && data.length > 0);
    }

    private async contestIsStart(contest_id: number) {
        const data = await cache_query("select start_time,end_time from contest where contest_id = ?", [contest_id]);
        const start_time = dayjs(data[0].start_time);
        const end_time = dayjs(data[0].end_time);
        const now = dayjs();
        return now.isAfter(start_time) && now.isBefore(end_time);
    }

    private async getLangmaskForContest(contest_id: number) {
        const data = await cache_query(`select langmask from contest 
        where contest_id = ?`, [contest_id]);
        return data[0].langmask;
    }

    private async getLangmaskForTopic(topic_id: number) {
        const data = await cache_query(`select langmask from special_subject 
        where topic_id = ?`, [topic_id]);
        return data[0].langmask;
    }

    private async checkContestPrivilege(req: Request, contest_id: number) {
        if (await ContestManager.isContestSubmittable(contest_id, req.session!.user_id)) {
            return true;
        }
        if (await ContestAssistantManager.userIsContestAssistant(contest_id, req.session!.user_id)) {
            return true;
        }
        await login_action(req, req.session!.user_id);

        const data = await cache_query("select private,defunct from contest where contest_id = ?", [contest_id]);
        const _private = parseInt(data[0].private) === 1;
        const defunct = data[0].defunct === "Y";
        if (defunct) {
            return false;
        }
        return !_private;
    }

    private async limitAddressForContest(connection: MySQLTransaction, req: Request, contest_id: number) {
        const referer = req && req.headers && req.headers.referer ? req.headers.referer : "no-referer";
        const data = await connection.query("select limit_hostname from contest where contest_id = ?", [contest_id]);
        let limit_hostname;
        if (data && data[0] && data[0].limit_hostname) {
            limit_hostname = data[0].limit_hostname;
        }
        // console.log(`limit Hostname: ${limit_hostname}`);
        // console.log(`Referer: ${referer}`);
        if (limit_hostname && referer.includes(limit_hostname)) {
            return true;
        } else if (!limit_hostname) {
            return true;
        } else {
            return limit_hostname;
        }
    }

    private async limitClassroomAccess(connection: MySQLTransaction, req: Request, contest_id: number) {
        const ip = getIP(req);
        let detectResult = detectClassroom(ip);
        // console.log("Detect IP result:", detectResult);
        const data = await connection.query("select ip_policy from contest where contest_id = ?", [contest_id]);
        let limitClassroom;
        if (data && data[0] && data[0].ip_policy) {
            limitClassroom = data[0].ip_policy.split(",").map((e: any) => e.trim());
        } else {
            return true;
        }
        // console.log("limitClassroom", limitClassroom);
        if (detectResult === null) {
            return false;
        }
        detectResult = detectResult.toString();
        let result = false;
        for (let i of limitClassroom) {
            if (i === detectResult) {
                result = true;
                break;
            }
        }
        return result;
    }

    private async checkTopicPrivilege(req: Request, topic_id: number) {
        if (req.session!.isadmin) {
            return;
        }
        const data = await cache_query("select private,defunct from special_subject where topic_id = ?", [topic_id]);
        const _private = parseInt(data[0].private) === 1;
        const defunct = data[0].defunct === "Y";
        if (defunct || _private === true) {
            throw error.errorMaker("You don't have privilege to access this topic");
        }
    }

    private async includeProblem(id: number, num: number, sql: string) {
        const data = await cache_query(sql, [id, num]);
        if (!data || data.length === 0) {
            return false;
        } else {
            return parseInt(data[0].problem_id);
        }
    }

    private async contestIncludeProblem(contest_id: number, num: number) {
        const result = await this.includeProblem(contest_id, num, `select problem_id from contest_problem
         where contest_id = ? and num = ?`);
        if (result === false) {
            throw error.errorMaker("problem is not in contest");
        }
        return result;
    }

    private async TopicIncludeProblem(topic_id: number, num: number) {
        const result = await this.includeProblem(topic_id, num, `select problem_id from special_subject_problem
         where topic_id = ? and num = ?`);
        if (result === false) {
            throw error.errorMaker("problem is not in topic");
        }
        return result;
    }

    private async problemPublic(problem_id: number) {
        const data = await cache_query("select defunct from problem where problem_id = ?", [problem_id]);
        if (!data || data.length === 0) {
            return ProblemPublicStatus.NOT_EXIST;
        } else {
            return data[0].defunct === "N" ? ProblemPublicStatus.PUBLIC : ProblemPublicStatus.PRIVATE;
        }
    }

    private async makePrependAndAppendCode(problem_id: number, source: string, language: number) {
        const data = await cache_query("select * from prefile where problem_id = ? and type = ?", [problem_id, language]);

        let new_source = this.deepCopy(source);

        if (data.length === 0) {
            return new_source;
        }
        let prepend_added = false, append_added = false;
        for (let i of data) {
            if (parseInt(i.prepend) === 1 && prepend_added === false) {
                new_source = i.code + "\n" + new_source;
                prepend_added = true;
            } else if (append_added === false) {
                append_added = true;
                new_source += "\n" + i.code;
            }
        }
        return new_source;
    }

    private checkLangmask(language: number, langmask: number = this.LANGMASK) {
        return Boolean((~langmask) & (2 ** language));
    }

    private async checkContestValidate(connection: MySQLTransaction, req: Request, originalContestID: number, originalPID: number, language: number) {
        if (isNaN(originalContestID) || isNaN(originalPID)) {
            throw error.errorMaker("Invalid contest_id or pid");
        }
        const positiveContestID = Math.abs(originalContestID);
        let limit_address = await this.limitAddressForContest(connection, req, positiveContestID);
        if (typeof limit_address === "string") {
            throw error.errorMaker(`根据管理员设置的策略，请从${limit_address}访问本页提交`);
        }
        let limit_classroom = await this.limitClassroomAccess(connection, req, positiveContestID);
        if (!limit_classroom) {
            throw error.errorMaker("根据管理员的设置，您无权在本IP段提交\n为了在考试/测验期间准确验证您的身份，请在acm.cup.edu.cn提交。");
        }
        await this.contestIncludeProblem(positiveContestID, originalPID);
        if (!await this.checkContestPrivilege(req, positiveContestID)) {
            throw error.errorMaker("You don't have privilege to access this contest problem");
        }
        if (!await this.contestIsStart(positiveContestID)) {
            throw error.errorMaker("Contest is not start");
        }
        const contest_langmask = await this.getLangmaskForContest(positiveContestID);
        if (!this.checkLangmask(language, contest_langmask)) {
            throw error.errorMaker("Your submission's language is invalid");
        }
        return true;
    }

    private async prepareRequest(req: Request, cookie: Record<string, string>) {
        if (!req.session || !req.session.user_id) {
            let obj: any = {};
            obj.session = {};
            obj.session.user_id = cookie["user_id"];
            let user_id = cookie["user_id"];
            let token = cookie["token"];
            const original_token = await client.lrangeAsync(`${user_id}token`, 0, -1);
            if (original_token.indexOf(token) !== -1) {
                await login_action(obj, user_id);
            }
            Object.assign(req, obj);
        }
    }

    private dataErrorChecker(data: SubmissionData) {
        if (!data) {
            throw error.errorMaker("submission invalid!");
        } else if (data.source && data.source.length > 64 * 1024) {
            throw error.errorMaker("Your code is too long!");
        } else if (data.input_text && data.input_text.length && data.input_text.length > 1000) {
            throw error.errorMaker("Your custom input length cannot exceed 1000!");
        }
    }

    private classifySubmissionType(data: SubmissionData) {
        let submission_type = undefined;
        if (data.type === "problem") {
            submission_type = SubmissionType.PROBLEM;
        } else if (data.type === "contest") {
            submission_type = SubmissionType.CONTEST;
        } else if (data.type === "topic") {
            submission_type = SubmissionType.TOPIC;
        }
        if (typeof submission_type === "undefined") {
            throw error.errorMaker("submission type is not valid");
        }
        return submission_type;
    }

    private async insertTransaction(connection: MySQLTransaction, { result, source_code, source_code_user, data }: any, testRun: boolean) {
        const solution_id = result.insertId;
        let promiseArray = [connection.query(`insert into source_code_user(solution_id,source,hash)
        values(?,?,?)`, [solution_id, source_code_user, this.createCodeHash(source_code_user)]),
        connection.query(`insert into source_code(solution_id, source)
        values(?,?)`, [solution_id, source_code])
        ];
        if (testRun) {
            data.input_text = this.dos2unix(data.input_text);
            promiseArray.push(connection.query(`insert into custominput(solution_id, input_text)
            values(?,?)`, [solution_id, data.input_text]));
        }
        await Promise.all(promiseArray);
        await connection.query("COMMIT");
        return {
            status: "OK",
            solution_id
        };
    }

    private async normalSubmissionTransaction(connection: MySQLTransaction, req: any, data: SubmissionData) {
        // @ts-ignore
        const originalProblemId = parseInt(data.id);
        const language = parseInt(data.language as string);
        if (isNaN(originalProblemId)) {
            throw error.errorMaker("Problem ID is not valid");
        }
        const positiveProblemId = Math.abs(originalProblemId);
        if (!this.checkLangmask(language)) {
            throw error.errorMaker("Your language is not valid");
        }
        const problemPublicStatus = await this.problemPublic(positiveProblemId);
        switch (problemPublicStatus) {
            case ProblemPublicStatus.NOT_EXIST:
                throw error.errorMaker("problem is not exist");
            case ProblemPublicStatus.PUBLIC:
                break;
            case ProblemPublicStatus.PRIVATE:
                if (req.session.isadmin || req.session.editor || req.session.problem_maker[`p${positiveProblemId}`]) {
                    break;
                } else {
                    throw error.errorMaker("You don't have privilege to access this problem");
                }
        }
        if (await this.problemInFutureOrCurrentContest(positiveProblemId) && !(req.session.isadmin || req.session.editor || req.session.problem_maker[`p${positiveProblemId}`])) {
            throw error.errorMaker("problem is in current or future contest.");
        }

        const source_code = await this.makePrependAndAppendCode(positiveProblemId, data.source, language);
        const [source_code_user, IP, judger, fingerprint, fingerprintRaw, share] = [this.deepCopy(data.source), getIP(req), "待分配", data.fingerprint, data.fingerprintRaw, Boolean(data.share)];
        const code_length = source_code_user.length;
        const result = await connection.query(`insert into solution(problem_id,user_id,in_date,language,ip,code_length,share,judger,fingerprint,fingerprintRaw)
        values(?,?,NOW(),?,?,?,?,?,?,?)`, [originalProblemId, req.session!.user_id, language, IP, code_length, share, judger, fingerprint, fingerprintRaw]);
        Logger.log("result", result);
        return await this.insertTransaction(connection, { result, source_code, source_code_user, data }, originalProblemId !== positiveProblemId);
    }

    // Core Logic Placeholder
    public async submit(req: Request, data: SubmissionData, cookie: Record<string, string>): Promise<SubmissionResponse> {
        const connection = await MySQLManager.transaction();
        Logger.log("start submit transaction.");
        try {
            await this.prepareRequest(req, cookie);
            this.dataErrorChecker(data);
            const submissionType = this.classifySubmissionType(data);
            if (submissionType === SubmissionType.PROBLEM) {
                return this.normalSubmissionTransaction(connection, req, data);
            }
            const language = parseInt(data.language as string);
            const source_code_user = this.deepCopy(data.source);
            const IP = getIP(req);
            const judger = "待分配";
            const fingerprint = data.fingerprint;
            const fingerprintRaw = data.fingerprintRaw;
            const code_length = source_code_user.length;
            if (submissionType === SubmissionType.CONTEST) {
                const originalContestID = parseInt(data.cid as string);
                const originalPID = parseInt(data.pid as string);
                const positiveContestID = Math.abs(originalContestID);
                const testRunFlag = originalContestID !== positiveContestID;
                let problemId = await this.contestIncludeProblem(positiveContestID, Math.abs(originalPID));
                const source_code = await this.makePrependAndAppendCode(problemId, data.source, language);
                data.id = problemId;
                await this.checkContestValidate(connection, req, originalContestID, originalPID, language);
                if (testRunFlag) {
                    problemId = -Math.abs(problemId);
                }
                const result = await connection.query(`INSERT INTO solution(problem_id,user_id,in_date,language,ip,code_length,contest_id,num,judger,fingerprint,fingerprintRaw)
        values(?,?,NOW(),?,?,?,?,?,?,?,?)`, [problemId, req.session!.user_id, language, IP, code_length, positiveContestID, originalPID, judger, fingerprint, fingerprintRaw]);
                return await this.insertTransaction(connection, { result, source_code, source_code_user, data }, testRunFlag);
            } else if (submissionType === SubmissionType.TOPIC) {
                const originalTopicID = parseInt(data.tid as string);
                const originalPID = parseInt(data.pid as string);
                const positiveTopicID = Math.abs(originalTopicID);
                const testRunFlag = originalTopicID !== positiveTopicID;
                if (isNaN(originalTopicID) || isNaN(originalPID)) {
                    throw error.errorMaker("Invalid topic_id or pid");
                }
                let problemId = await this.TopicIncludeProblem(positiveTopicID, originalPID);
                const sourceCode = await this.makePrependAndAppendCode(problemId, data.source, language);
                await this.checkTopicPrivilege(req, positiveTopicID);
                const topicLangmask = await this.getLangmaskForTopic(positiveTopicID);
                if (!this.checkLangmask(language, topicLangmask)) {
                    throw error.errorMaker("Your submission's language is invalid");
                }
                if (testRunFlag) {
                    problemId = -Math.abs(problemId);
                }
                const result = await connection.query(`insert into solution(problem_id,user_id,in_date,language,ip,code_length,topic_id,num,judger,fingerprint,fingerprintRaw)
        values(?,?,NOW(),?,?,?,?,?,?,?,?)`, [problemId, req.session!.user_id, language, IP, code_length, positiveTopicID, originalPID, judger, fingerprint, fingerprintRaw]);
                return await this.insertTransaction(connection, {
                    result,
                    source_code: sourceCode,
                    source_code_user,
                    data
                }, testRunFlag);
            }
            return { status: "ERROR", solution_id: 0 };
        }
        catch (err: any) {
            Logger.log("failed submitControl", err);
            await connection.query("ROLLBACK");
            throw err;
        }
        finally {
            await connection.release();
        }
    }

    async getSimRelatedSolution(contestId?: number) {
        let sql = `select s.*,u2.nick as snick from(select t.*,u1.nick from (select * from sim where
		 s_user_id is not null and s_s_user_id is not null 
		 ${!contestId ? "" : ` and s_id in (select solution_id from
		 solution where contest_id = ?)`} )t left join users as u1
		on u1.user_id = t.s_user_id)s
 left join users as u2
		on u2.user_id = s.s_s_user_id`;
        const params = [];
        if (contestId) {
            params.push(contestId);
        }
        return await cache_query(sql, params);
    }

    async getRuntimeInfo(solutionId: number | string) {
        const sql = "SELECT `error` FROM `runtimeinfo` WHERE `solution_id`= ?";
        const data = await cache_query(sql, [solutionId]);
        return data; // Return raw data as route expects array
    }

    async getCompileInfo(solutionId: number | string) {
        const sql = "SELECT `error` FROM `compileinfo` WHERE `solution_id`= ?";
        const data = await cache_query(sql, [solutionId]);
        return data;
    }

    async getSolutionInfo(solutionId: number | string) {
        const _result = await cache_query(`SELECT user_id,
                                            language,
                                            if((share = 1 or solution_id in (select solution_id from
                                             tutorial where solution.solution_id = ?)) and not exists
                                             (select * from contest where contest_id in (select contest_id
                                             from contest_problem where solution.problem_id = contest_problem.problem_id)
                                             and end_time > NOW()), 1, 0) as share,time,memory,code_length from solution
                                     WHERE solution_id = ?`, [solutionId, solutionId]);
        return _result;
    }

    async getSolutionDetail(solutionId: number | string) {
        return await cache_query("select * from solution where solution_id=?", [solutionId]);
    }

    async getSubmissionResultStats() {
        return await cache_query("select count(1) as cnt,result from solution group by result order by result");
    }

    async getCodeLengthStats(statement: string = "1 = 1", sqlArr: any[] = []) {
        return await cache_query(`select in_date, code_length from solution where ${statement} and result = 4`, sqlArr);
    }

    async getSourceCode(solutionId: number | string) {
        const data = await cache_query("select source from source_code_user where solution_id = ?", [solutionId]);
        return data && data.length > 0 ? data[0].source : "Code not found.";
    }
}

export default new SubmissionService();
