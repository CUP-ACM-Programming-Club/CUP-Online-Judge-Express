
import { expect } from "chai";
import sinon from "sinon";
import Module from "module";
import { bindPort, boundImpl } from "../../../application/ports/registry";
import { adminContestRepository } from "../../../application/ports/AdminContestRepository";
import { contestCache } from "../../../application/ports/ContestCache";
import { dbModuleStub, isDbModuleRequest } from "../../helpers/db-module-stub";

const REPO_PATH = "../../../infrastructure/persistence/contest/MySqlAdminContestRepository";

describe("AdminContestService Tests", function () {
    let AdminContestService: any;
    let queryStub: sinon.SinonStub;
    let connectionStub: any;
    let mysqlManagerStub: any;
    let utilStub: any;
    let problemSetCacheStub: any;
    let contestCacheStub: any;
    let configManagerStub: any;
    let previousLoad: any;
    let previousRepo: any;
    let previousCache: any;

    beforeEach(function () {
        // 1. Setup Stubs
        queryStub = sinon.stub().resolves([]);

        connectionStub = {
            query: sinon.stub().resolves({ insertId: 1000 }),
            beginTransaction: sinon.stub().resolves(),
            commit: sinon.stub().resolves(),
            rollback: sinon.stub().resolves(),
            release: sinon.spy(),
            promise: function () { return this; }
        };

        mysqlManagerStub = {
            getConnection: sinon.stub().resolves(connectionStub)
        };

        utilStub = {
            addContestCompetitorWithTransaction: sinon.stub().resolves(),
            addContestProblemWithTransaction: sinon.stub().resolves(),
            removeAllCompetitorPrivilegeWithTransaction: sinon.stub().resolves(),
            removeAllContestProblemWithTransaction: sinon.stub().resolves(),
            trimProperty: sinon.stub().callsFake((obj) => obj), // Passthrough
            removeAllContestProblem: sinon.stub().resolves(),
            addContestProblem: sinon.stub().resolves(),
            removeAllCompetitorPrivilege: sinon.stub().resolves(),
            addContestCompetitor: sinon.stub().resolves(),
            isNumber: (val: any) => !isNaN(val)
        };

        problemSetCacheStub = {
            removeAll: sinon.stub()
        };

        contestCacheStub = {
            removeAll: sinon.stub()
        };

        configManagerStub = {
            getConfig: sinon.stub().returns("0")
        };

        // 2. Intercept Module._load
        previousLoad = (Module as any)._load;
        (Module as any)._load = function (request: string, parent: any, isMain: boolean) {
            if (isDbModuleRequest(request)) return dbModuleStub({ query: queryStub });
            if (request.includes("MySQLManager")) return { MySQLManager: mysqlManagerStub };
            if (request.includes("shared/isNumber")) {
                const fn = (val: any) => !isNaN(val);
                (fn as any).default = fn;
                return fn;
            }
            if (/(^|\/)util$/.test(request)) return utilStub; // strict matching to avoid matching isNumber if path overlaps
            if (request.includes("ProblemSetCachePool")) return problemSetCacheStub;
            if (request.includes("ContestCachePool")) return contestCacheStub;
            if (request.includes("config-manager")) return { ConfigManager: configManagerStub };

            return previousLoad.apply(this, arguments);
        };

        // 3. Re-require Service
        delete require.cache[require.resolve("../../../application/services/admin/AdminContestService")];
        AdminContestService = require("../../../application/services/admin/AdminContestService").default;
        // SQL 在仓储实现里：在拦截生效时重新加载真实仓储并绑定到端口，让它的 mysql_query / MySQLManager 走上面的桩
        delete require.cache[require.resolve(REPO_PATH)];
        previousRepo = boundImpl(adminContestRepository);
        previousCache = boundImpl(contestCache);
        bindPort(adminContestRepository, require(REPO_PATH).default);
        bindPort(contestCache, contestCacheStub);
    });

    afterEach(function () {
        if (previousLoad) (Module as any)._load = previousLoad;
        if (previousRepo) bindPort(adminContestRepository, previousRepo);
        if (previousCache) bindPort(contestCache, previousCache);
        delete require.cache[require.resolve(REPO_PATH)];
        sinon.restore();
    });

    describe("getContestList", () => {
        it("should return contest list", async () => {
            // Use withArgs for robustness
            queryStub.withArgs(sinon.match(/select \* from contest/)).resolves([{ contest_id: 1, title: "C1" }]);
            queryStub.withArgs(sinon.match(/select count\(1\)/)).resolves([{ cnt: 10 }]);

            const result = await AdminContestService.getContestList(0, 50);
            expect(result.data).to.have.lengthOf(1);
            expect(result.count).to.equal(10);
        });

        it("should handle custom where and order", async () => {
            // Mock valid return to prevent crash
            queryStub.resolves([{ cnt: 0 }]); // For count query
            queryStub.onCall(0).resolves([]); // Data query

            await AdminContestService.getContestList(0, 50, { where: "w", order: "o" });
            const sql = queryStub.firstCall.args[0];
            expect(sql).to.include("w");
            expect(sql).to.include("o");
        });
    });

    describe("toggleContestDefunct", () => {
        it("should toggle Y to N", async () => {
            queryStub.onCall(0).resolves([{ defunct: "Y" }]);
            const res = await AdminContestService.toggleContestDefunct(1);
            expect(res).to.equal("N");
            expect(queryStub.calledTwice).to.be.true; // select + update
        });
    });

    describe("createContest", () => {
        it("should create contest and add relations", async () => {
            queryStub.resolves({ insertId: 999 });
            const data = {
                title: "New Contest",
                startTime: "2023-01-01",
                endTime: "2023-01-02",
                ContestMode: false,
                Public: true,
                problemSelected: [],
                userList: []
            };

            const id = await AdminContestService.createContest(data, "user_id");
            expect(id).to.equal(999);
            expect(utilStub.addContestProblem.calledWith(999)).to.be.true;
            expect(problemSetCacheStub.removeAll.called).to.be.true;
            expect(contestCacheStub.removeAll.called).to.be.true;
        });
    });

    describe("updateContest", () => {
        it("should update contest with transaction", async () => {
            const data = {
                title: "Updated",
                startTime: "2023-01-01",
                endTime: "2023-01-02",
                problemSelected: [],
                userList: []
            };

            await AdminContestService.updateContest(1000, data);

            expect(connectionStub.beginTransaction.called).to.be.true;
            expect(connectionStub.commit.called).to.be.true;
            expect(connectionStub.release.called).to.be.true;
            expect(utilStub.removeAllContestProblemWithTransaction.called).to.be.true;
        });

        it("should rollback on error", async () => {
            connectionStub.query.rejects(new Error("Update Error"));
            try {
                await AdminContestService.updateContest(1000, {});
                expect.fail("Should throw");
            } catch (e) {
                expect(connectionStub.rollback.called).to.be.true;
            }
        });
    });
});
