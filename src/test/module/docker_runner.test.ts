
const expect = require("chai").expect;
const sinon = require("sinon");
const Module = require("module");
import dockerRunner from "../../module/docker_runner";

describe("Docker Runner Tests", function () {
    let runner: any;
    let queryStub: any;
    let judgerStub: any;
    let previousLoad: any;

    beforeEach(function () {
        queryStub = sinon.stub().resolves([]);
        judgerStub = {
            on: sinon.spy(),
            registerEventListener: sinon.spy(),
            setSolutionID: sinon.spy(),
            setLanguage: sinon.spy(),
            setCode: sinon.spy(),
            setUserID: sinon.spy(),
            run: sinon.stub().resolves()
        };

        // Mock docker_judger class
        const mockJudgerClass = sinon.stub().returns(judgerStub);

        previousLoad = Module._load;
        Module._load = function (request: string, parent: any, isMain: any) {
            if (request.includes("mysql_query")) return { query: queryStub };
            if (request.includes("docker_judger")) return { default: mockJudgerClass, __esModule: true };
            if (request.includes("mysql_cache")) return sinon.stub().resolves([]);
            if (request === "os") return { platform: () => "linux" }; // Mock linux
            return previousLoad.apply(this, arguments);
        };

        // Re-require
        delete require.cache[require.resolve("../../module/docker_runner")];
        const RunnerClass = require("../../module/docker_runner").default;
        runner = new RunnerClass("/home/oj", 1);
    });

    afterEach(function () {
        Module._load = previousLoad;
        sinon.restore();
    });

    it("should initialize correctly", function () {
        expect(runner.oj_home).to.equal("/home/oj");
        expect(runner.judge_queue.length).to.equal(1);
    });

    it("should add task to waiting queue if judgers busy", function () {
        // empty free queue to simulate busy
        runner.judge_queue = [];

        runner.addTask({
            submission_id: 100,
            val: {
                language: 1,
                id: 1000,
                source: "code"
            },
            user_id: "user1"
        });

        expect(runner.waiting_queue).to.include(100);
        expect(runner.waiting_package[100]).to.exist;
    });

    it("should run task immediately if judger available", async function () {
        runner.runJudger = sinon.spy();

        runner.addTask({
            submission_id: 101,
            val: {
                language: 1,
                id: 1000,
                source: "code"
            },
            user_id: "user1"
        });

        expect(runner.judging_queue).to.include(101);
        expect(runner.runJudger.called).to.be.true;
    });
});
