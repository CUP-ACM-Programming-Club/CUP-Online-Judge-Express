
import { expect } from "chai";
import sinon from "sinon";
import Module from "module";

describe("UnjudgedSubmissionCollector", function () {
    let Collector: any;
    let queryStub: sinon.SinonStub;
    let judgerStub: any;
    let configStub: any;
    let previousLoad: any;

    beforeEach(function () {
        // 1. Stubs
        queryStub = sinon.stub().resolves([]);
        judgerStub = { addTask: sinon.stub().resolves() };
        configStub = {
            isSwitchedOn: sinon.stub().returns(false), // Disable loop
            getConfig: sinon.stub().returns(30)
        };

        // 2. Intercept
        previousLoad = (Module as any)._load;
        (Module as any)._load = function (request: string, parent: any, isMain: boolean) {
            if (request.includes("mysql/MySQLManager")) return { MySQLManager: { execQuery: queryStub, transaction: sinon.stub() } };
            if (request.includes("judger") && !request.includes("UnjudgedSubmissionCollector")) return { localJudger: {}, default: judgerStub };
            if (request.includes("config/config-manager")) return { ConfigManager: configStub };
            if (request.includes("decorator/RetryAsync")) return { wait: sinon.stub().resolves() };
            return previousLoad.apply(this, arguments);
        };

        // 3. Load
        delete require.cache[require.resolve("../../../module/judger/UnjudgedSubmissionCollector")];
        Collector = require("../../../module/judger/UnjudgedSubmissionCollector").default;
        console.log("Collector:", Collector);
        if (!Collector || typeof Collector.setJudger !== "function") {
            // Fallback if .default is not correct structure
            const mod = require("../../../module/judger/UnjudgedSubmissionCollector");
            // console.log("Module:", mod);
            if (mod.setJudger) Collector = mod;
        }
        Collector.setJudger(judgerStub);
    });

    afterEach(function () {
        if (previousLoad) (Module as any)._load = previousLoad;
        sinon.restore();
    });

    it("should query for rejudge tasks", async () => {
        await Collector.collectHandler();

        const calls = queryStub.getCalls();
        const rejudgeCall = calls.find(c => c.args[0].includes("result=1"));

        expect(rejudgeCall).to.exist;
        if (!rejudgeCall) throw new Error("rejudgeCall missing");
        // Verify it includes DESC order
        expect(rejudgeCall.args[0]).to.include("order by solution_id desc");
        // Verify it NO LONGER includes the time restriction
        expect(rejudgeCall.args[0]).to.not.include("in_date <");
    });

    it("should handle task failure by setting result=15", async () => {
        // Mock addTask to throw error for specific ID
        judgerStub.addTask.withArgs(1003).rejects(new Error("Test Error"));

        // Mock DB result with a failing task
        queryStub.withArgs(sinon.match(/SELECT solution_id/)).resolves([{ solution_id: "1003", user_id: "u1", result: 0 }]);
        queryStub.withArgs(sinon.match(/SELECT count\(1\)/)).resolves([{ cnt: 0 }]);

        await Collector.collectHandler();

        const updateCall = queryStub.getCalls().find(c => c.args[0].includes("update solution set result=15"));
        expect(updateCall).to.exist;
        if (!updateCall) throw new Error("Update call missing");
        expect(updateCall.args[1][0]).to.equal(1003);
    });

    it("should handle task timeout by setting result=15", async () => {
        // Mock config to return short timeout (50ms)
        configStub.getConfig.withArgs("judger_request_timeout").returns(50);

        // Mock addTask to hang longer than timeout (200ms)
        judgerStub.addTask.withArgs(1004).returns(new Promise(resolve => setTimeout(resolve, 200)));

        // Mock DB result
        queryStub.withArgs(sinon.match(/SELECT solution_id/)).resolves([{ solution_id: "1004", user_id: "u1", result: 0 }]);
        queryStub.withArgs(sinon.match(/SELECT count\(1\)/)).resolves([{ cnt: 0 }]);

        await Collector.collectHandler();

        const updateCall = queryStub.getCalls().find(c => c.args[0].includes("update solution set result=15"));
        expect(updateCall).to.exist;
        if (!updateCall) throw new Error("Update call missing");
        expect(updateCall.args[1][0]).to.equal(1004);
    });
});
