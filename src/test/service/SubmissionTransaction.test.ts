const expect = require("chai").expect;
const sinon = require("sinon");
const Module = require("module");
import { openTransaction } from "../../infrastructure/db/mysql/transaction";
import { rebindSubmissionServicePorts } from "../setup/submission-ports";

/**
 * 提交路径的事务语义：用真实 openTransaction + 假连接，断言
 * 成功：START TRANSACTION -> 插入 -> COMMIT -> release
 * 失败：START TRANSACTION -> ... -> ROLLBACK -> release
 */
describe("SubmissionService submit transaction", function () {
    let service: any;
    let queryStub: any;
    let previousLoad: any;
    let log: string[];
    let failOn: RegExp | null;
    let restorePorts: () => void;

    const mockReq = () => ({ session: { user_id: "test_user", isadmin: false }, headers: {} });

    function fakePool() {
        const connection: any = {
            threadId: 7,
            query(sql: string, binding: any, cb: any) {
                if (typeof binding === "function") {
                    cb = binding;
                }
                const normalized = sql.replace(/\s+/g, " ").trim();
                log.push(normalized.split(" (")[0].split("(")[0].trim());
                const fail = failOn && failOn.test(normalized);
                // 异步回调，用于暴露漏掉的 await（否则 release 会抢在 COMMIT 前执行）
                setTimeout(() => {
                    if (fail) {
                        cb(new Error("DB Insert Error"));
                    } else if (/^select/i.test(normalized)) {
                        cb(null, []);
                    } else {
                        cb(null, { insertId: 555 });
                    }
                }, 2);
            },
            release() {
                log.push("<release>");
            },
            destroy() {
                log.push("<destroy>");
            }
        };
        return {
            getConnection(cb: any) {
                setImmediate(() => cb(null, connection));
            }
        };
    }

    beforeEach(function () {
        log = [];
        failOn = null;
        queryStub = sinon.stub().resolves([]);
        const pool = fakePool();
        const mysqlManagerStub = { transaction: () => openTransaction(pool) };
        const redisStub = { lrangeAsync: sinon.stub().resolves([]) };
        previousLoad = Module._load;
        Module._load = function (request: string) {
            if (request.includes("mysql_cache")) return queryStub;
            if (request.includes("mysql_query")) return queryStub;
            if (request.includes("login_action")) return sinon.stub();
            if (request.includes("Logger")) {
                const loggerStub = { log: sinon.stub() };
                return { default: loggerStub, ...loggerStub };
            }
            if (request.includes("detect_classroom")) return sinon.stub().returns(null);
            if (request.includes("ContestAssistantManager")) return { userIsContestAssistant: sinon.stub().resolves(false) };
            if (request.includes("ContestManager")) return { isContestSubmittable: sinon.stub().resolves(true) };
            if (request.includes("MySQLManager")) return { MySQLManager: mysqlManagerStub };
            if (request.includes("redis")) return { default: redisStub };
            if (request.includes("const_name")) return { langmask: 0 };
            if (request.includes("getIP")) return () => "127.0.0.1";
            return previousLoad.apply(this, arguments);
        };
        // 提交的 SQL / 事务在仓储里：拦截生效期间重新加载并绑定到端口
        restorePorts = rebindSubmissionServicePorts();
        delete require.cache[require.resolve("../../application/services/SubmissionService")];
        const ServiceModule = require("../../application/services/SubmissionService");
        service = new ServiceModule.SubmissionService();
    });

    afterEach(function () {
        restorePorts();
        Module._load = previousLoad;
        delete require.cache[require.resolve("../../application/services/SubmissionService")];
        sinon.restore();
    });

    function stubProblemReads() {
        queryStub.withArgs(sinon.match(/select defunct from problem/)).resolves([{ defunct: "N" }]);
        queryStub.withArgs(sinon.match(/select contest_id.*from contest/)).resolves([]);
        queryStub.withArgs(sinon.match(/select \* from prefile/)).resolves([]);
    }

    it("problem submission: BEGIN -> inserts -> COMMIT, then release once (after COMMIT)", async function () {
        stubProblemReads();
        const res = await service.submit(mockReq(), { type: "problem", id: 1000, language: 1, source: "code" }, {});
        expect(res).to.deep.equal({ status: "OK", solution_id: 555 });
        expect(log[0]).to.equal("START TRANSACTION");
        expect(log).to.include("insert into solution");
        expect(log.slice(-2)).to.deep.equal(["COMMIT", "<release>"]);
        expect(log.filter(l => l === "<release>")).to.have.length(1);
        expect(log).to.not.include("ROLLBACK");
    });

    it("problem submission failure: BEGIN -> failed insert -> ROLLBACK, then release once", async function () {
        stubProblemReads();
        failOn = /^insert into solution/i;
        let thrown: any = null;
        try {
            await service.submit(mockReq(), { type: "problem", id: 1000, language: 1, source: "code" }, {});
        } catch (e) {
            thrown = e;
        }
        expect(thrown).to.have.property("message", "DB Insert Error");
        expect(log).to.deep.equal(["START TRANSACTION", "insert into solution", "ROLLBACK", "<release>"]);
    });

    it("problem submission failure in a later insert rolls back the solution row", async function () {
        stubProblemReads();
        failOn = /^insert into source_code_user/i;
        let thrown: any = null;
        try {
            await service.submit(mockReq(), { type: "problem", id: 1000, language: 1, source: "code" }, {});
        } catch (e) {
            thrown = e;
        }
        expect(thrown).to.have.property("message", "DB Insert Error");
        expect(log[0]).to.equal("START TRANSACTION");
        expect(log).to.not.include("COMMIT");
        expect(log.slice(-2)).to.deep.equal(["ROLLBACK", "<release>"]);
    });

    it("validation error before any insert: BEGIN -> ROLLBACK -> release", async function () {
        queryStub.withArgs(sinon.match(/select defunct from problem/)).resolves([]);
        let thrown: any = null;
        try {
            await service.submit(mockReq(), { type: "problem", id: 1000, language: 1, source: "code" }, {});
        } catch (e) {
            thrown = e;
        }
        expect(thrown).to.not.equal(null);
        expect(log).to.deep.equal(["START TRANSACTION", "ROLLBACK", "<release>"]);
    });

    it("contest submission: BEGIN -> ... -> COMMIT -> release", async function () {
        queryStub.withArgs(sinon.match(/select problem_id from contest_problem/)).resolves([{ problem_id: 2000 }]);
        queryStub.withArgs(sinon.match(/select start_time,end_time from contest/)).resolves([{ start_time: "2020-01-01", end_time: "2099-01-01" }]);
        queryStub.withArgs(sinon.match(/select langmask from contest/)).resolves([{ langmask: 0 }]);
        const res = await service.submit(mockReq(), { type: "contest", cid: 100, pid: 0, language: 1, source: "c" }, {});
        expect(res.status).to.equal("OK");
        expect(log[0]).to.equal("START TRANSACTION");
        expect(log).to.include("INSERT INTO solution");
        expect(log.slice(-2)).to.deep.equal(["COMMIT", "<release>"]);
    });
});
