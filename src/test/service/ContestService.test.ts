
import { expect } from "chai";
import sinon from "sinon";
import Module from "module";
import { bindPort, boundImpl } from "../../application/ports/registry";
import { contestRepository } from "../../application/ports/ContestRepository";
import { contestCache } from "../../application/ports/ContestCache";
import { dbModuleStub, isDbModuleRequest } from "../helpers/db-module-stub";

const REPO_PATH = "../../infrastructure/persistence/contest/MySqlContestRepository";

describe("ContestService Tests", function () {
    let ContestService: any;
    let cacheQueryStub: sinon.SinonStub;
    let queryStub: sinon.SinonStub;
    let contestManagerStub: any;
    let contestAssistantStub: any;
    let previousLoad: any;
    let previousRepo: any;
    let previousCache: any;
    let buildContestListCriteria: any;

    const mockReq = {
        query: {} as any,
        session: {
            user_id: "test_user",
            isadmin: false,
            contest_manager: false,
            contest_maker: {} as any,
            contest: {} as any
        }
    };

    beforeEach(function () {
        // 1. Setup Stubs
        cacheQueryStub = sinon.stub();
        queryStub = sinon.stub().resolves([]);

        contestManagerStub = {
            getContestList: sinon.stub().resolves([]),
            getContestListCount: sinon.stub().resolves(0),
            getAllContest: sinon.stub().resolves([]),
            getTotalNumber: sinon.stub().resolves(0)
        };

        contestAssistantStub = {
            userIsContestAssistant: sinon.stub().resolves(false)
        };

        const contestCachePoolStart = {
            get: sinon.stub().resolves(null),
            set: sinon.stub()
        };

        // 2. Intercept Module._load
        previousLoad = (Module as any)._load;
        (Module as any)._load = function (request: string, parent: any, isMain: boolean) {
            if (isDbModuleRequest(request)) return dbModuleStub({ query: queryStub, cachedQuery: cacheQueryStub });
            if (request.includes("ContestManager")) return { default: contestManagerStub, ...contestManagerStub };
            if (request.includes("ContestAssistantManager")) return { default: contestAssistantStub, ...contestAssistantStub };
            if (request.includes("ContestCachePool")) return contestCachePoolStart;

            return previousLoad.apply(this, arguments);
        };

        // 3. Re-require Service；数据访问在仓储实现里：在拦截生效时重新加载真实仓储并绑定到端口，
        //    这样仓储里的 mysql_cache / mysql_query / ContestManager 都走上面的桩
        delete require.cache[require.resolve("../../application/services/ContestService")];
        const serviceModule = require("../../application/services/ContestService");
        ContestService = serviceModule.default;
        buildContestListCriteria = serviceModule.buildContestListCriteria;
        delete require.cache[require.resolve(REPO_PATH)];
        previousRepo = boundImpl(contestRepository);
        previousCache = boundImpl(contestCache);
        bindPort(contestRepository, require(REPO_PATH).default);
        bindPort(contestCache, contestCachePoolStart as any);
    });

    afterEach(function () {
        if (previousLoad) (Module as any)._load = previousLoad;
        if (previousRepo) bindPort(contestRepository, previousRepo);
        if (previousCache) bindPort(contestCache, previousCache);
        delete require.cache[require.resolve(REPO_PATH)];
        sinon.restore();
    });

    describe("checkContestAccess", () => {
        it("should return contest detail if accessible", async () => {
            // Mock contest
            cacheQueryStub.withArgs("SELECT * FROM contest WHERE contest_id = ?", [1000]).resolves([{
                contest_id: 1000,
                start_time: new Date(Date.now() - 10000), // Started
                end_time: new Date(Date.now() + 10000),
                cmod_visible: "0", // Visible in normal mode
                private: "0"
            }]);

            // @ts-ignore
            global.contest_mode = false;

            const result = await ContestService.checkContestAccess(mockReq, 1000);
            expect(result.contest_id).to.equal(1000);
        });

        it("should throw error if contest not found", async () => {
            cacheQueryStub.resolves([]);
            try {
                await ContestService.checkContestAccess(mockReq, 9999);
                expect.fail("Should throw error");
            } catch (e: any) {
                expect(e.status).to.equal("error");
                expect(e.statement).to.equal("Contest not found");
            }
        });

        it("should throw error if contest not started", async () => {
            cacheQueryStub.resolves([{
                contest_id: 1001,
                start_time: new Date(Date.now() + 10000), // Future
                cmod_visible: "0", // Visible but not started
                private: "0"
            }]);
            // @ts-ignore
            global.contest_mode = false;

            try {
                await ContestService.checkContestAccess(mockReq, 1001);
                expect.fail("Should throw error");
            } catch (e: any) {
                expect(e.statement).to.contain("Contest not start");
            }
        });
    });

    describe("Manager Delegates", () => {
        it("should delegate getContestList to Manager", async () => {
            await ContestService.getContestList(mockReq);
            expect(contestManagerStub.getContestList.calledWith(buildContestListCriteria(mockReq))).to.be.true;
        });
        it("should delegate getContestListAsObject to Manager", async () => {
            await ContestService.getContestListAsObject(mockReq);
            expect(contestManagerStub.getContestList.calledWith(buildContestListCriteria(mockReq))).to.be.true;
            expect(contestManagerStub.getContestListCount.calledWith(buildContestListCriteria(mockReq))).to.be.true;
        });
        it("should delegate getAllContestList to Manager", async () => {
            await ContestService.getAllContestList(mockReq);
            expect(contestManagerStub.getAllContest.called).to.be.true;
        });
        it("should hide hidden contests from getAllContestList for normal users", async () => {
            contestManagerStub.getAllContest.resolves([{ contest_id: 1, defunct: "N" }, { contest_id: 2, defunct: "Y" }]);
            const res = await ContestService.getAllContestList(mockReq);
            expect(res.status).to.equal("OK");
            expect(res.data.map((c: any) => c.contest_id)).to.deep.equal([1]);
        });
        it("should keep hidden contests in getAllContestList for admins and contest managers", async () => {
            contestManagerStub.getAllContest.resolves([{ contest_id: 1, defunct: "N" }, { contest_id: 2, defunct: "Y" }]);
            const admin = { session: { ...mockReq.session, isadmin: true } };
            const manager = { session: { ...mockReq.session, contest_manager: true } };
            expect((await ContestService.getAllContestList(admin)).data.length).to.equal(2);
            expect((await ContestService.getAllContestList(manager)).data.length).to.equal(2);
        });
        it("should delegate getTotalNumber to Manager", async () => {
            await ContestService.getTotalNumber(mockReq);
            expect(contestManagerStub.getTotalNumber.calledWith(buildContestListCriteria(mockReq))).to.be.true;
        });
    });

    describe("checkContestAccess", () => {
        // ... existing tests ...

        it("should block access if global contest mode ON and contest not visible", async () => {
            // @ts-ignore
            global.contest_mode = true;
            cacheQueryStub.resolves([{
                contest_id: 1000,
                cmod_visible: "0",
                start_time: new Date(Date.now() - 10000)
            }]);

            try {
                await ContestService.checkContestAccess(mockReq, 1000);
                expect.fail("Should throw");
            } catch (e: any) {
                expect(e.statement).to.contain("Contest Mode Active");
            } finally {
                // @ts-ignore
                global.contest_mode = false;
            }
        });

        it("should allow access if global contest mode ON and contest IS visible", async () => {
            // @ts-ignore
            global.contest_mode = true;
            cacheQueryStub.resolves([{
                contest_id: 1000,
                cmod_visible: "1",
                start_time: new Date(Date.now() - 10000),
                private: "0"
            }]);

            const res = await ContestService.checkContestAccess(mockReq, 1000);
            expect(res.contest_id).to.equal(1000);
            // @ts-ignore
            global.contest_mode = false;
        });

        it("should block access if global contest mode OFF and contest visible ONLY in contest mode", async () => {
            // If cmod_visible '1' means "Visible in Contest Mode"? 
            // Logic in Service:
            // if (!global.contest_mode) { if (parseInt(cmod_visible) === 1) throw ... }
            // So if cmod_visible=1, it is hidden in normal mode? 
            // Usually cmod_visible=0 means visible everywhere?
            cacheQueryStub.resolves([{
                contest_id: 1000,
                cmod_visible: "1",
                start_time: new Date(Date.now() - 10000)
            }]);

            try {
                await ContestService.checkContestAccess(mockReq, 1000);
                expect.fail("Should throw");
            } catch (e: any) {
                expect(e.statement).to.contain("Contest Mode Active");
                // Error message is same "Contest Mode Active", slightly confusing but correct per code
            }
        });

        it("should throw Permission Denied for private contest if no privilege", async () => {
            cacheQueryStub.resolves([{
                contest_id: 1000,
                start_time: new Date(Date.now() - 10000),
                end_time: new Date(Date.now() + 10000),
                cmod_visible: "0",
                private: "1"
            }]);

            // mockReq has no rights
            try {
                await ContestService.checkContestAccess(mockReq, 1000);
                expect.fail("Should throw");
            } catch (e: any) {
                expect(e.statement).to.contain("Permission denied");
            }
        });

        it("should block a hidden public contest for a normal user", async () => {
            cacheQueryStub.resolves([{
                contest_id: 1000,
                start_time: new Date(Date.now() - 10000),
                cmod_visible: "0",
                private: "0",
                defunct: "Y"
            }]);
            try {
                await ContestService.checkContestAccess(mockReq, 1000);
                expect.fail("Should throw");
            } catch (e: any) {
                expect(e.statement).to.contain("Permission denied");
            }
        });

        it("should allow a hidden contest for a listed contestant", async () => {
            cacheQueryStub.resolves([{
                contest_id: 1000,
                start_time: new Date(Date.now() - 10000),
                cmod_visible: "0",
                private: "1",
                defunct: "Y"
            }]);
            const listed = { session: { ...mockReq.session, contest: { c1000: true } } };
            const res = await ContestService.checkContestAccess(listed, 1000);
            expect(res.contest_id).to.equal(1000);
        });

        it("should allow a hidden contest for its maker and for contest managers", async () => {
            cacheQueryStub.resolves([{
                contest_id: 1000,
                start_time: new Date(Date.now() - 10000),
                cmod_visible: "0",
                private: "0",
                defunct: "Y"
            }]);
            const maker = { session: { ...mockReq.session, contest_maker: { m1000: true } } };
            const manager = { session: { ...mockReq.session, contest_manager: true } };
            expect((await ContestService.checkContestAccess(maker, 1000)).contest_id).to.equal(1000);
            expect((await ContestService.checkContestAccess(manager, 1000)).contest_id).to.equal(1000);
        });

        it("should allow private contest if Assistant", async () => {
            cacheQueryStub.resolves([{
                contest_id: 1000,
                start_time: new Date(Date.now() - 10000),
                private: "1",
                cmod_visible: "0"
            }]);
            contestAssistantStub.userIsContestAssistant.resolves(true);

            const res = await ContestService.checkContestAccess(mockReq, 1000);
            expect(res.contest_id).to.equal(1000);
        });
    });

    describe("getContestProblemList", () => {
        // ... existing AC test ...

        it("should return Vjudge problem list", async () => {
            // Mock Access: vjudge = 1
            cacheQueryStub.onCall(0).resolves([{
                contest_id: 1000,
                start_time: new Date(),
                end_time: new Date(Date.now() + 10000), // running
                vjudge: 1,
                private: "0"
            }]);

            // Mock Query for Vjudge Problems
            cacheQueryStub.onCall(1).resolves([{
                title: "VJ Problem",
                pid: 500,
                source: "POJ"
            }]);

            // Mock User Status
            cacheQueryStub.onCall(2).resolves([]);

            // Limit
            cacheQueryStub.onCall(3).resolves([{ limit_hostname: null }]);

            const res = await ContestService.getContestProblemList(mockReq, 1000);
            expect(res.data[0].source).to.equal("POJ");
        });

        it("should mask PIDs if contest running and no privilege", async () => {
            // Mock Access: running, private=0 (public but checking browse priv)
            cacheQueryStub.onCall(0).resolves([{
                contest_id: 1000,
                start_time: new Date(Date.now() - 1000),
                end_time: new Date(Date.now() + 100000), // running
                vjudge: 0,
                private: "0"
            }]);

            // Problems
            cacheQueryStub.onCall(1).resolves([{ pid: 100, title: "A", pnum: 0 }]);

            // User Status
            cacheQueryStub.onCall(2).resolves([]);

            // Limit
            cacheQueryStub.onCall(3).resolves([{ limit_hostname: null }]);

            // Ensure no privilege
            mockReq.session.isadmin = false;
            contestAssistantStub.userIsContestAssistant.resolves(false);

            const res = await ContestService.getContestProblemList(mockReq, 1000);

            expect(res.data[0].pid).to.equal(""); // Masked
        });

        it("should NOT mask PIDs if contest ended", async () => {
            cacheQueryStub.onCall(0).resolves([{
                contest_id: 1000,
                start_time: new Date(Date.now() - 2000),
                end_time: new Date(Date.now() - 1000), // ended
                vjudge: 0,
                private: "0"
            }]);
            cacheQueryStub.onCall(1).resolves([{ pid: 100, title: "A", pnum: 0 }]);
            cacheQueryStub.onCall(2).resolves([]);
            cacheQueryStub.onCall(3).resolves([{ limit_hostname: null }]);

            const res = await ContestService.getContestProblemList(mockReq, 1000);
            expect(res.data[0].pid).to.equal(100); // Visible
        });
    });

    describe("getContestStatistics", () => {
        it("should return statistics", async () => {
            // Mock queries: 0. 比赛（门禁：已开始的公开比赛）, 1. stats, 2. total
            cacheQueryStub.onCall(0).resolves([{ contest_id: 1000, private: 0, defunct: "N", cmod_visible: 0, start_time: "2000-01-01 00:00:00" }]);
            cacheQueryStub.onCall(1).resolves([]);
            cacheQueryStub.onCall(2).resolves([{ total_problem: 10 }]);

            const result = await ContestService.getContestStatistics(mockReq, 1000);
            expect(result.status).to.equal("OK");
            expect(result.total).to.equal(10);
        });
    });
});
