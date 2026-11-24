import { expect } from "chai";
import sinon from "sinon";
import Module from "module";
import { ScoreboardInvalidator } from "../../../module/judger/recorder/ScoreboardInvalidator";

function flush() {
    return new Promise(resolve => setImmediate(resolve));
}

describe("ScoreboardInvalidator", function () {
    let clock: sinon.SinonFakeTimers | null = null;

    afterEach(function () {
        if (clock) {
            clock.restore();
            clock = null;
        }
        sinon.restore();
    });

    function make(overrides: any = {}) {
        const deps = {
            lookupContestId: sinon.stub().resolves(1001),
            clearScoreboardCache: sinon.stub().resolves(),
            logError: sinon.stub(),
            trailingDelayMs: 0,
            ...overrides
        };
        return { deps, inv: new ScoreboardInvalidator(deps) };
    }

    it("clears the contest scoreboard cache for a contest submission", async function () {
        const { deps, inv } = make();
        inv.invalidateBySolution(55);
        await flush();
        expect(deps.lookupContestId.calledOnceWith(55)).to.equal(true);
        expect(deps.clearScoreboardCache.calledOnceWith(1001)).to.equal(true);
        expect(deps.logError.called).to.equal(false);
    });

    it("does nothing for non-contest submissions", async function () {
        const { deps, inv } = make({ lookupContestId: sinon.stub().resolves(null) });
        inv.invalidateBySolution(56);
        await flush();
        expect(deps.clearScoreboardCache.called).to.equal(false);
    });

    it("never throws and only logs when Redis clear fails", async function () {
        const { deps, inv } = make({ clearScoreboardCache: sinon.stub().rejects(new Error("redis down")) });
        expect(() => inv.invalidateBySolution(57)).to.not.throw();
        await flush();
        expect(deps.logError.calledOnce).to.equal(true);
    });

    it("never throws and only logs when the contest lookup fails", async function () {
        const { deps, inv } = make({ lookupContestId: sinon.stub().rejects(new Error("mysql down")) });
        expect(() => inv.invalidateBySolution(58)).to.not.throw();
        await flush();
        expect(deps.logError.calledOnce).to.equal(true);
        expect(deps.clearScoreboardCache.called).to.equal(false);
    });

    it("never throws when lookup throws synchronously", async function () {
        const { deps, inv } = make({ lookupContestId: () => { throw new Error("sync"); } });
        expect(() => inv.invalidateBySolution(59)).to.not.throw();
        await flush();
        expect(deps.logError.calledOnce).to.equal(true);
    });

    it("schedules one coalesced trailing clear per contest", async function () {
        clock = sinon.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
        const { deps, inv } = make({ trailingDelayMs: 3000 });
        inv.invalidateBySolution(1);
        inv.invalidateBySolution(2);
        inv.invalidateBySolution(3);
        await flush();
        expect(deps.clearScoreboardCache.callCount).to.equal(3);
        clock.tick(3000);
        await flush();
        expect(deps.clearScoreboardCache.callCount).to.equal(4);
        clock.tick(10000);
        await flush();
        expect(deps.clearScoreboardCache.callCount).to.equal(4);
    });
});

describe("recorder.storeSubmission scoreboard invalidation", function () {
    let previousLoad: any;
    let queryStub: sinon.SinonStub;
    let invalidateStub: sinon.SinonStub;
    let recorder: any;

    beforeEach(function () {
        queryStub = sinon.stub().resolves([]);
        invalidateStub = sinon.stub();
        previousLoad = (Module as any)._load;
        (Module as any)._load = function (request: string) {
            if (request.includes("recorder/ScoreboardInvalidator")) return { __esModule: true, default: { invalidateBySolution: invalidateStub } };
            if (request.includes("recorder/Maintainer")) return { __esModule: true, default: { maintainUserInfo: sinon.stub().resolves(), maintainProblem: sinon.stub().resolves() } };
            if (request.includes("submission/SubmissionManager")) return { __esModule: true, default: { getSolutionInfo: sinon.stub().resolves({ problem_id: 1000 }) } };
            if (request.includes("user/user")) return { getUserIdBySolutionId: sinon.stub().resolves("u") };
            if (request.includes("mysql_query") || request.includes("mysql_cache")) return queryStub;
            return previousLoad.apply(this, arguments);
        };
        delete require.cache[require.resolve("../../../module/judger/recorder")];
        recorder = require("../../../module/judger/recorder");
    });

    afterEach(function () {
        (Module as any)._load = previousLoad;
        delete require.cache[require.resolve("../../../module/judger/recorder")];
        sinon.restore();
    });

    const payload = (state: number) => ({
        solution_id: 777, user_id: "u", problem_id: 1000, time: 1, memory: 1, result: state, pass_point: 1,
        state, pass_rate: 1, judger: "j", sim: 0, sim_s_id: 0, runtime_info: "", compile_info: "", test_run_result: ""
    });

    it("invalidates after the verdict update has been written", async function () {
        await recorder.storeSubmission(payload(4));
        expect(invalidateStub.calledOnceWith(777)).to.equal(true);
        const updateCall = queryStub.getCalls().find(c => /update solution set time/.test(c.args[0]));
        expect(updateCall, "verdict update").to.not.equal(undefined);
        expect(updateCall!.calledBefore(invalidateStub.firstCall)).to.equal(true);
    });

    it("invalidates for compile error verdicts too", async function () {
        await recorder.storeSubmission(payload(11));
        expect(invalidateStub.calledOnceWith(777)).to.equal(true);
    });

    it("does not invalidate when storing the verdict failed", async function () {
        queryStub.withArgs(sinon.match(/update solution set time/)).rejects(new Error("db"));
        let thrown: any = null;
        try {
            await recorder.storeSubmission(payload(4));
        } catch (e) {
            thrown = e;
        }
        expect(thrown).to.not.equal(null);
        expect(invalidateStub.called).to.equal(false);
    });
});
