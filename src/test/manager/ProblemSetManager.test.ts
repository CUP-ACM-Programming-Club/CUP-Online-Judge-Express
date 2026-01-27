
const expect = require("chai").expect;
const sinon = require("sinon");
const Module = require("module");
// We cannot import ProblemSetManager directly here because we need to mock dependencies first.

describe("ProblemSetManager Tests", function () {
    let ProblemSetManager: any;
    let cacheQueryStub: any;
    let previousLoad: any;

    const mockReq = {
        params: {},
        query: {},
        session: {
            user_id: "test_user",
            isadmin: false,
            source_browser: false,
            editor: false
        }
    };

    const mockRes = {
        json: sinon.spy()
    };

    beforeEach(function () {
        // 1. Setup Stubs
        cacheQueryStub = sinon.stub();

        // Mock DB returns
        cacheQueryStub.returns([]); // Default return

        // 2. Intercept Module._load
        previousLoad = (Module as any)._load;
        (Module as any)._load = function (request: string, parent: any, isMain: boolean) {
            if (request.includes("mysql_cache")) return cacheQueryStub;
            // Mock other dependencies if needed
            // e.g. ../decorator/common/ContestModeChecker
            // Since decorators run on class definition, we might need to mock them or let them pass.
            // ProblemSetManager uses @ContestModeChecker(0). If this imports mysql_cache/query, we are fine if we mocked those.
            // But decorators often import things.
            // Let's assume standard decorators are fine or we might hit errors.
            return previousLoad.apply(this, arguments);
        };

        // 3. Re-require
        delete require.cache[require.resolve("../../manager/problem/ProblemSetManager")];
        delete require.cache[require.resolve("../../module/common/CachePool")]; // decorators use this
        ProblemSetManager = require("../../manager/problem/ProblemSetManager").default;
    });

    afterEach(function () {
        if (previousLoad) (Module as any)._load = previousLoad;
        sinon.restore();
    });

    it("should default start to 0 if missing in params", async function () {
        mockReq.params = {}; // no start
        // Mock count and list queries
        cacheQueryStub.resolves([{ cnt: 10 }]); // total
        cacheQueryStub.onCall(1).resolves([{ problem_id: 1000 }]); // list
        cacheQueryStub.onCall(2).resolves([]); // one month count

        await ProblemSetManager.getProblem(mockReq, mockRes);

        const calls = cacheQueryStub.getCalls();
        const listQuery = calls.find((c: any) => c.args[0].includes("limit ?,?"));
        expect(listQuery).to.exist;

        // Check params passed to limit
        // array params: [..., start * page_cnt, page_cnt]
        const params = listQuery.args[1];
        const startParam = params[params.length - 2];
        expect(startParam).to.equal(0); // 0 * 50 = 0
    });

    it("should use provided start parameter", async function () {
        mockReq.params = { start: "2" }; // start page 2

        cacheQueryStub.resolves([{ cnt: 100 }]);
        cacheQueryStub.onCall(1).resolves([{ problem_id: 1000 }]);
        cacheQueryStub.onCall(2).resolves([]);

        await ProblemSetManager.getProblem(mockReq, mockRes);

        const calls = cacheQueryStub.getCalls();
        const listQuery = calls.find((c: any) => c.args[0].includes("limit ?,?"));
        const params = listQuery.args[1];
        const startParam = params[params.length - 2];

        // start=2 -> offset = 2 * 50 = 100
        expect(startParam).to.equal(100);
    });

    it("should handle nan start parameter gracefully (default 0)", async function () {
        mockReq.params = { start: "abc" };

        cacheQueryStub.resolves([{ cnt: 10 }]);
        cacheQueryStub.onCall(1).resolves([]);
        cacheQueryStub.onCall(2).resolves([]);

        await ProblemSetManager.getProblem(mockReq, mockRes);

        const calls = cacheQueryStub.getCalls();
        const listQuery = calls.find((c: any) => c.args[0].includes("limit ?,?"));
        const params = listQuery.args[1];
        const startParam = params[params.length - 2];

        expect(startParam).to.equal(0);
    });
});
