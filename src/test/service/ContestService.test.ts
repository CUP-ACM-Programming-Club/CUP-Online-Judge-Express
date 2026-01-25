
import { expect } from "chai";
import sinon from "sinon";
import Module from "module";

describe("ContestService Tests", function () {
    let ContestService: any;
    let cacheQueryStub: sinon.SinonStub;
    let queryStub: sinon.SinonStub;
    let contestManagerStub: any;
    let contestAssistantStub: any;
    let previousLoad: any;

    const mockReq = {
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
            getContestListAsObjectByRequest: sinon.stub().resolves({ contestInfoList: [], total: 0 }),
            getAllContestList: sinon.stub().resolves([]),
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
            if (request.includes("mysql_cache")) return cacheQueryStub;
            if (request.includes("mysql_query")) return queryStub;
            if (request.includes("ContestManager")) return { default: contestManagerStub, ...contestManagerStub };
            if (request.includes("ContestAssistantManager")) return { default: contestAssistantStub, ...contestAssistantStub };
            if (request.includes("ContestCachePool")) return contestCachePoolStart;

            return previousLoad.apply(this, arguments);
        };

        // 3. Re-require Service
        delete require.cache[require.resolve("../../service/ContestService")];
        ContestService = require("../../service/ContestService").default;
    });

    afterEach(function () {
        if (previousLoad) (Module as any)._load = previousLoad;
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
            expect(contestManagerStub.getContestList.calledWith(mockReq)).to.be.true;
        });
        it("should delegate getContestListAsObject to Manager", async () => {
            await ContestService.getContestListAsObject(mockReq);
            expect(contestManagerStub.getContestListAsObjectByRequest.calledWith(mockReq)).to.be.true;
        });
        it("should delegate getAllContestList to Manager", async () => {
            await ContestService.getAllContestList();
            expect(contestManagerStub.getAllContestList.called).to.be.true;
        });
        it("should delegate getTotalNumber to Manager", async () => {
            await ContestService.getTotalNumber(mockReq);
            expect(contestManagerStub.getTotalNumber.calledWith(mockReq)).to.be.true;
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
            // Mock queries: 1. stats, 2. total
            cacheQueryStub.onCall(0).resolves([]);
            cacheQueryStub.onCall(1).resolves([{ total_problem: 10 }]);

            const result = await ContestService.getContestStatistics(mockReq, 1000);
            expect(result.status).to.equal("OK");
            expect(result.total).to.equal(10);
        });
    });
});
