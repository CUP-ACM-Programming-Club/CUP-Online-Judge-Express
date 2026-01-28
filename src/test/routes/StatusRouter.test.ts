
const expect = require("chai").expect;
const sinon = require("sinon");
const Module = require("module");
const request = require("supertest");
const express = require("express");

describe("Status Router Legacy Routes", function () {
    let statusRouter: any;
    let statusServiceStub: any;
    let submissionServiceStub: any;
    let app: any;
    let previousLoad: any;

    beforeEach(function () {
        // 1. Setup Stubs for Dependencies
        statusServiceStub = {
            getStatusList: sinon.stub().resolves({ result: [], total: 0 }),
            getGraphData: sinon.stub().resolves({})
        };

        submissionServiceStub = {
            getSolutionInfo: sinon.stub().resolves([]),
            getCompileInfo: sinon.stub().resolves([]),
            getRuntimeInfo: sinon.stub().resolves([]),
            getSourceCode: sinon.stub().resolves(""),
            checkPrivilege: sinon.stub().resolves(true)
        };

        const authStub = (req, res, next) => next();
        const loggerStub = {
            logger: () => ({ info: () => { }, error: (msg, e) => console.error(msg, e) })
        };
        const commonStub = {};

        // 2. Intercept Module._load
        previousLoad = (Module as any)._load;
        (Module as any)._load = function (requestStr: string, parent: any, isMain: boolean) {

            if (requestStr.includes("ContestAssistantManager")) return { default: {} };
            if (requestStr.includes("SourcePrivilegeCache")) {
                const mock = { checkPrivilege: sinon.stub().resolves(true) };
                return { ...mock, default: mock };
            }
            if (requestStr.includes("middleware/auth")) return { default: authStub };
            if (requestStr.includes("middleware/admin")) return authStub;
            if (requestStr.includes("logger")) return loggerStub;
            if (requestStr.includes("const_name")) return {};
            if (requestStr.includes("const_var")) return [{}];
            if (requestStr.includes("redis")) return { default: {} };
            if (requestStr.includes("SubmissionService")) {
                return { ...submissionServiceStub, default: submissionServiceStub };
            }
            if (requestStr.includes("StatusService") && !requestStr.includes("routes")) { // Avoid intercepting route file itself if path is confusing
                return { ...statusServiceStub, default: statusServiceStub };
            }

            // Sub-routes
            if (requestStr.includes("./status/")) return [(req, res, next) => next()];

            return previousLoad.apply(this, arguments);
        };

        // 3. Clear cache
        Object.keys(require.cache).forEach(key => {
            if (key.includes("routes\\status")) {
                delete require.cache[key];
            }
        });

        const routeExport = require("../../routes/status");

        // Setup Express
        app = express();
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        // Mimic session and params logic if needed, but for now just mount the router
        app.use((req, res, next) => {

            req.session = { user_id: "test", isadmin: false };
            next();
        });

        // The export is [path, auth, router] or object with properties
        // Check export structure: module.exports = ["/status", auth, router];
        const statusPath = routeExport[0];
        const routerCb = routeExport[2];

        app.use(statusPath, routerCb);
    });

    afterEach(function () {
        if (previousLoad) (Module as any)._load = previousLoad;
        sinon.restore();
    });

    it("should handle 5 params (legacy standard)", async function () {
        // /:pid/:uid/:lang/:res/:limit
        await request(app)
            .get("/status/1000/test/1/4/20")
            .expect(200);

        const call = statusServiceStub.getStatusList.lastCall;
        const query = call.args[1];
        const limit = query.limit; // limit is passed either in query object or separate arg depending on get_status impl

        expect(query.problem_id).to.equal(1000);
        expect(query.user_id).to.equal("test");
        expect(query.language).to.equal(1);
        expect(query.result).to.equal(4);
        expect(limit).to.equal(20);
    });

    it("should handle 6 params with contest_id", async function () {
        // /:pid/:uid/:lang/:res/:limit/:contest_id
        await request(app)
            .get("/status/null/null/null/null/0/1001")
            .expect(200);

        const call = statusServiceStub.getStatusList.lastCall;
        const query = call.args[1];

        expect(query.contest_id).to.equal(1001);
        expect(query.sim).to.be.undefined;
    });

    it("should handle 6 params with sim (when param 6 < 1000)", async function () {
        // /:pid/:uid/:lang/:res/:limit/:sim
        // If param 6 is 1 (sim=true) and < 1000, legacy logic might try to match contest_id route first.
        // Legacy contest_id route checks: if (contest_id < 1000) next();
        // So 1 < 1000, call next().
        // Then match sim route.
        await request(app)
            .get("/status/null/null/null/null/0/1")
            .expect(200);

        const call = statusServiceStub.getStatusList.lastCall;
        const query = call.args[1];

        expect(query.contest_id).to.be.undefined;
        expect(query.sim).to.be.true; // !!1
    });

    it("should handle 7 params (cid + sim)", async function () {
        // /:pid/:uid/:lang/:res/:limit/:contest_id/:sim
        await request(app)
            .get("/status/null/null/null/null/0/1001/1")
            .expect(200);

        const call = statusServiceStub.getStatusList.lastCall;
        const query = call.args[1];

        expect(query.contest_id).to.equal(1001);
        expect(query.sim).to.be.true;
    });

    it("should handle the user reported failing case (7 params with 0s)", async function () {
        // /api/status/null/2016011253/null/null/0/0/0
        const res = await request(app)
            .get("/status/null/2016011253/null/null/0/0/0");


        expect(res.status).to.equal(200);

        const call = statusServiceStub.getStatusList.lastCall;
        const query = call.args[1];

        expect(query.user_id).to.equal("2016011253");
        expect(query.sim).to.be.false;
        expect(Array.isArray(query.problem_id)).to.be.true;
        expect(query.problem_id[0]).to.be.undefined;
    });

    it("should return source code in /solution endpoint", async function () {
        const sid = 3885859;
        const mockSolutionInfo = [{
            user_id: "test",
            language: 21,
            time: 1,
            memory: 1536,
            share: 1
        }];

        submissionServiceStub.getSolutionInfo.resolves(mockSolutionInfo);
        submissionServiceStub.getSourceCode.resolves("int main() { return 0; }");

        const res = await request(app)
            .get(`/status/solution?sid=${sid}`)
            .expect(200);

        expect(res.body.status).to.equal("OK");
        expect(res.body.data.solution_id).to.equal(sid);
        expect(res.body.data.source).to.equal("int main() { return 0; }");
    });
});
