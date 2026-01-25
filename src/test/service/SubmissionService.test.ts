
const expect = require("chai").expect;
const sinon = require("sinon");
const Module = require("module");
import { SubmissionService } from "../../service/SubmissionService";
import { SubmissionType } from "../../enums/SubmissionEnums";

describe("Submission Service Tests", function () {
    let service: SubmissionService;
    let queryStub: any;
    let contestAssistantStub: any;
    let contestManagerStub: any;
    let mysqlManagerStub: any;
    let connectionStub: any;
    let redisStub: any;
    let previousLoad: any;

    const mockReq = {
        session: {
            user_id: "test_user",
            isadmin: false
        },
        headers: {}
    };

    beforeEach(function () {
        queryStub = sinon.stub().resolves([]);
        contestAssistantStub = {
            userIsContestAssistant: sinon.stub().resolves(false)
        };
        contestManagerStub = {
            isContestSubmittable: sinon.stub().resolves(true)
        };

        connectionStub = {
            query: sinon.stub().resolves({ insertId: 100 }),
            release: sinon.spy()
        };

        mysqlManagerStub = {
            transaction: sinon.stub().resolves(connectionStub)
        };
        redisStub = {
            lrangeAsync: sinon.stub().resolves([])
        };

        previousLoad = Module._load;
        Module._load = function (request: string, parent: any, isMain: any) {
            if (request.includes("mysql_cache")) return queryStub;
            if (request.includes("mysql_query")) return queryStub;
            if (request.includes("login_action")) return sinon.stub();

            if (request.includes("Logger")) {
                const loggerStub = { log: sinon.stub() };
                return { default: loggerStub, ...loggerStub };
            }

            if (request.includes("detect_classroom")) return sinon.stub().returns(null); // default null
            if (request.includes("ContestAssistantManager")) return contestAssistantStub;
            if (request.includes("ContestManager")) return contestManagerStub;
            if (request.includes("MySQLManager")) return { MySQLManager: mysqlManagerStub, MySQLTransaction: class { } };
            if (request.includes("redis")) return { default: redisStub };
            if (request.includes("const_name")) return { langmask: 0 };
            if (request.includes("getIP")) return () => "127.0.0.1";
            return previousLoad.apply(this, arguments);
        };

        delete require.cache[require.resolve("../../service/SubmissionService")];
        const ServiceModule = require("../../service/SubmissionService");
        service = new ServiceModule.SubmissionService();
    });

    afterEach(function () {
        if (previousLoad) Module._load = previousLoad;
        sinon.restore();
    });

    // ...

    it("should handle error in submission (rollback)", async function () {
        // Mock DB Error during insert (1st call)
        // Note: other queries might happen before insert?
        // Service flow:
        // 1. prepareRequest -> client.lrangeAsync (Redis)
        // 2. dataErrorChecker
        // 3. classifySubmissionType
        // 4. normalSubmissionTransaction -> problemPublic -> select defunct (MySQL)
        // 5. checkLangmask
        // 6. problemInFutureOrCurrentContest -> select contest_id (MySQL)
        // 7. makePrependAndAppendCode -> select * from prefile (MySQL)
        // 8. insert into solution (MySQL) -> THIS IS THE ONE TO REJECT

        // So we need to count calls correctly or use matchers for previous calls.

        // Let's use withArgs for reads, but onCall logic for writes? 
        // Or mixed?
        queryStub.withArgs(sinon.match(/select defunct from problem/)).resolves([{ defunct: 'N' }]);
        queryStub.withArgs(sinon.match(/select contest_id.*from contest/)).resolves([]);
        queryStub.withArgs(sinon.match(/select \* from prefile/)).resolves([]);

        // Fail on insert
        connectionStub.query.withArgs(sinon.match(/insert into solution/)).rejects(new Error("DB Insert Error"));
        // Allow other queries (like Rollback) to resolve by default stub behavior (resolves(insertId: 100))

        const data = {
            type: "problem",
            id: 1000,
            language: 1,
            source: "code",
            fingerprint: "fp",
            fingerprintRaw: "fpr",
            share: false
        };

        try {
            await service.submit(mockReq as any, data as any, {});
            expect.fail("Should throw");
        } catch (e: any) {
            expect(e.message).to.equal("DB Insert Error");
            // Verify insert was attempted
            expect(connectionStub.query.calledWith(sinon.match(/insert into solution/))).to.be.true;
        }
    });

    it("should reject too long source code", async function () {
        const data = {
            type: "problem",
            source: "a".repeat(64 * 1024 + 1)
        };
        try {
            await service.submit(mockReq as any, data as any, {});
            expect.fail("Should throw");
        } catch (e: any) {
            expect(e.statement).to.contain("too long");
        }
    });

    it("should reject invalid language", async function () {
        // langmask for problem is default (all allowed usually, but checkLangmask uses default)
        // Service checkLangmask uses this.LANGMASK.
        // If we pass an invalid language index (e.g. out of bounds or masked)
        // Let's assume language 100 is invalid
        const data = {
            type: "problem",
            id: 1000,
            language: 100,
            source: "code"
        };
        try {
            await service.submit(mockReq as any, data as any, {});
            expect.fail("Should throw");
        } catch (e: any) {
            expect(e.statement).to.contain("not valid"); // "Your language is not valid"
        }
    });

    it("should reject private problem without privilege", async function () {
        queryStub.withArgs(sinon.match(/select defunct from problem/)).resolves([{ defunct: 'N' }]); // public check first
        // problemPublic calls select defunct.
        // But logic: 
        // if defunct='N' -> PUBLIC. if defunct='Y' -> ??? 
        // Code: data[0].defunct === "N" ? PUBLIC : PRIVATE.
        // So we need to return something else than 'N', e.g. 'Y' (defunct) or we need to simulate PRIVATE status logic?
        // Wait, ProblemPublicStatus enum logic. 
        // If defunct='N', it returns PUBLIC. 
        // If defunct='Y', it returns PRIVATE.
        // Actually typical logic: 'N' is Normal (Public), 'Y' is Defunct (Deleted/Private).

        // Let's test PRIVATE scenario
        queryStub.withArgs(sinon.match(/select defunct from problem/)).resolves([{ defunct: 'Y' }]); // Private

        const data = { type: "problem", id: 1000, language: 1, source: "code" };
        const req: any = { session: { user_id: "user", isadmin: false, problem_maker: {} } }; // No priv

        try {
            await service.submit(req, data as any, {});
            expect.fail("Should throw");
        } catch (e: any) {
            expect(e.statement).to.contain("privilege");
        }
    });

    it("should reject problem in active contest", async function () {
        // Mock problem is PUBLIC ('N')
        queryStub.withArgs(sinon.match(/select defunct from problem/)).resolves([{ defunct: 'N' }]);
        // Mock problem is IN contest
        // select contest_id...
        queryStub.withArgs(sinon.match(/select contest_id.*from contest/)).resolves([{ contest_id: 100 }]);

        const data = { type: "problem", id: 1000, language: 1, source: "code" };
        const req: any = { session: { user_id: "user", isadmin: false, problem_maker: {} } };

        try {
            await service.submit(req, data as any, {});
            expect.fail("Should throw");
        } catch (e: any) {
            expect(e.statement).to.contain("future contest");
        }
    });

    it("should apply prepend/append code", async function () {
        queryStub.withArgs(sinon.match(/select defunct from problem/)).resolves([{ defunct: 'N' }]);
        queryStub.withArgs(sinon.match(/select contest_id.*from contest/)).resolves([]);
        // Mock prefile
        queryStub.withArgs(sinon.match(/select \* from prefile/)).resolves([
            { type: 1, code: "PRE", prepend: 1 },
            { type: 1, code: "APP", prepend: 0 }
        ]);
        connectionStub.query.withArgs(sinon.match(/insert into solution/)).resolves({ insertId: 101 });

        const data = { type: "problem", id: 1000, language: 1, source: "CODE" };
        const response = await service.submit(mockReq as any, data as any, {});
        expect(response.status).to.equal("OK");
        expect(connectionStub.query.called).to.be.true;
    });

    it("should handle contest submission", async function () {
        // Mock contest problem existence
        // contestIncludeProblem -> includeProblem -> select problem_id ...
        queryStub.withArgs(sinon.match(/select problem_id from contest_problem/)).resolves([{ problem_id: 2000 }]);

        // Mock contest validation
        // limitAddress -> null
        // limitClassroom -> null (return true)
        // contestPrivilege -> true (isContestSubmittable stub default true)
        // contestIsStart -> true
        queryStub.withArgs(sinon.match(/select start_time,end_time from contest/)).resolves([{
            start_time: "2020-01-01",
            end_time: "2099-01-01"
        }]);
        // contest langmask
        queryStub.withArgs(sinon.match(/select langmask from contest/)).resolves([{ langmask: 0 }]); // 0 means all allowed

        connectionStub.query.withArgs(sinon.match(/INSERT INTO solution/)).resolves({ insertId: 200 });

        const data = {
            type: "contest",
            cid: 100,
            pid: 0,
            language: 1,
            source: "contest code",
            fingerprint: "fp",
            fingerprintRaw: "fpr"
        };

        const response = await service.submit(mockReq as any, data as any, {});

        expect(response.status).to.equal("OK");
        expect(connectionStub.query.called).to.be.true;
    });

    it("should handle topic submission", async function () {
        // Mock topic problem existence
        queryStub.withArgs(sinon.match(/select problem_id from special_subject_problem/)).resolves([{ problem_id: 3000 }]);

        // Mock topic validation
        // checkTopicPrivilege -> select private,defunct ...
        queryStub.withArgs(sinon.match(/select private,defunct from special_subject/)).resolves([{ private: 0, defunct: 'N' }]);

        // Mock topic langmask
        queryStub.withArgs(sinon.match(/select langmask from special_subject/)).resolves([{ langmask: 0 }]);

        connectionStub.query.withArgs(sinon.match(/insert into solution/)).resolves({ insertId: 300 });

        const data = {
            type: "topic",
            tid: 50,
            pid: 1,
            language: 1,
            source: "topic code",
            fingerprint: "fp",
            fingerprintRaw: "fpr"
        };

        const response = await service.submit(mockReq as any, data as any, {});

        expect(response.status).to.equal("OK");
        expect(connectionStub.query.called).to.be.true;
    });

    it("should reject contest submission if contest is private and no right", async function () {
        queryStub.withArgs(sinon.match(/select problem_id from contest_problem/)).resolves([{ problem_id: 2000 }]);
        // limitAddress -> null
        // limitClassroom -> null

        // contestPrivilege -> checkContestPrivilege
        // isContestSubmittable stub -> returns FALSE
        contestManagerStub.isContestSubmittable.resolves(false);
        // userIsContestAssistant -> false (setup defaults)

        // select private,defunct
        queryStub.withArgs(sinon.match(/select private,defunct from contest/)).resolves([{ private: 1, defunct: 'N' }]);

        const data = { type: "contest", cid: 100, pid: 0, language: 1, source: "code" };
        try {
            await service.submit(mockReq as any, data as any, {});
            expect.fail("Should throw");
        } catch (e: any) {
            expect(e.statement).to.contain("privilege");
        }
    });

    it("should reject contest submission if contest not start", async function () {
        queryStub.withArgs(sinon.match(/select problem_id from contest_problem/)).resolves([{ problem_id: 2000 }]);
        contestManagerStub.isContestSubmittable.resolves(true); // Have priv

        // contestIsStart -> false
        queryStub.withArgs(sinon.match(/select start_time,end_time from contest/)).resolves([{
            start_time: "2099-01-01",
            end_time: "2100-01-01"
        }]);

        const data = { type: "contest", cid: 100, pid: 0, language: 1, source: "code" };
        try {
            await service.submit(mockReq as any, data as any, {});
            expect.fail("Should throw");
        } catch (e: any) {
            expect(e.statement).to.contain("not start");
        }
    });
});
