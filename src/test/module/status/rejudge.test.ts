
import { expect } from "chai";
import sinon from "sinon";
import Module from "module";

describe("Rejudge Logic (update_solution_result)", function () {
    let rejudgeModule: any;
    let queryStub: sinon.SinonStub;
    let judgerStub: any;
    let scoreboardStub: any;
    let redisStub: any;
    let previousLoad: any;

    beforeEach(function () {
        // 1. Mocks
        queryStub = sinon.stub().resolves([]);
        judgerStub = {
            addTask: sinon.stub().resolves(true)
        };
        scoreboardStub = {
            clearScoreboardCache: sinon.stub().resolves()
        };
        redisStub = {
            lpush: sinon.stub().resolves()
        };

        // 2. Intercept
        previousLoad = (Module as any)._load;
        (Module as any)._load = function (request: string, parent: any, isMain: boolean) {
            if (request.includes("mysql_query")) return queryStub;
            if (request.includes("judger")) {
                // Return default export as the stub
                return { default: judgerStub };
            }
            if (request.includes("ScoreboardService")) return { default: scoreboardStub };
            if (request.includes("redis")) return { default: redisStub };
            return previousLoad.apply(this, arguments);
        };

        // 3. Load Module
        delete require.cache[require.resolve("../../../../module/status/update_solution_result")];
        rejudgeModule = require("../../../module/status/update_solution_result");
    });

    afterEach(function () {
        if (previousLoad) (Module as any)._load = previousLoad;
        sinon.restore();
    });

    describe("rejudgeSolution", () => {
        it("should reset status and trigger judger", async () => {
            // Mock find solution to return user_id
            queryStub.withArgs(sinon.match(/SELECT user_id/)).resolves([{ user_id: "test_user" }]);
            // Mock privilege check (not admin)
            queryStub.withArgs(sinon.match(/SELECT count\(1\)/)).resolves([{ cnt: 0 }]);

            await rejudgeModule.rejudgeSolution(1001);

            // Verify DB Update
            const updateCall = queryStub.getCalls().find(c => c.args[0].includes("UPDATE solution"));
            expect(updateCall).to.exist;
            if (!updateCall) throw new Error("Update call missing");
            expect(updateCall.args[0]).to.include("result = 1");
            expect(updateCall.args[0]).to.include("solution_id = ?");
            expect(updateCall.args[0]).to.include("judger = 'Waiting'");

            // Verify Judger Trigger
            expect(judgerStub.addTask.calledWith(1001, false)).to.be.true;
        });

        it("should set admin flag if privileged", async () => {
            // Mock find solution
            queryStub.withArgs(sinon.match(/SELECT user_id/)).resolves([{ user_id: "admin_user" }]);
            // Mock privilege check (IS admin)
            queryStub.withArgs(sinon.match(/SELECT count\(1\)/)).resolves([{ cnt: 1 }]);

            await rejudgeModule.rejudgeSolution(1002);

            expect(judgerStub.addTask.calledWith(1002, true)).to.be.true;
        });
    });

    describe("rejudgeContest", () => {
        it("should reset status and clear scoreboard cache", async () => {
            await rejudgeModule.rejudgeContest(500);

            // Verify DB Update
            const updateCall = queryStub.getCalls().find(c => c.args[0].includes("UPDATE solution"));
            expect(updateCall).to.exist;
            if (!updateCall) throw new Error("Update call missing");
            expect(updateCall.args[0]).to.include("contest_id = ?");

            // Verify Cache Clear
            expect(scoreboardStub.clearScoreboardCache.calledWith(500)).to.be.true;
        });
    });
});
