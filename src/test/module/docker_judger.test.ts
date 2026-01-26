const expect = require("chai").expect;
const sinon = require("sinon");
const Module = require("module");

describe("Docker Judger Tests", function () {
    let judger: any;
    let queryStub: any;
    let fsStub: any;
    let fsPromisesStub: any;
    let sandboxStub: any;
    let submitStub: any;
    let previousLoad: any;
    let dockerJudgerClass: any;

    beforeEach(function () {
        queryStub = sinon.stub();
        fsStub = {
            existsSync: sinon.stub().returns(true) // Mock docker/index.js exists
        };
        fsPromisesStub = {
            readdir: sinon.stub().resolves([])
        };
        submitStub = {
            pushInputRawFiles: sinon.spy(),
            pushFileStdin: sinon.spy(),
            pushAnswerFiles: sinon.spy(),
            setFileStdin: sinon.spy(),
            setLanguage: sinon.spy(),
            setTimeLimit: sinon.spy(),
            setTimeLimitReserve: sinon.spy(),
            setMemoryLimit: sinon.spy(),
            setMemoryLimitReverse: sinon.spy(),
            setCompareFunction: sinon.spy(),
            on: sinon.spy(),
            emit: sinon.spy()
        };
        sandboxStub = {
            createSubmit: sinon.stub().returns(submitStub),
            runner: sinon.stub().resolves({ status: 0 })
        };

        previousLoad = Module._load;
        Module._load = function (request: string, parent: any, isMain: any) {
            if (request.includes("mysql_query")) return queryStub;
            if (request.includes("docker/index")) return sandboxStub;
            if (request.includes("docker/checker")) return { compareDiff: sinon.spy() };
            if (request === "fs") return fsStub;
            if (request === "fs/promises") return fsPromisesStub;
            return previousLoad.apply(this, arguments);
        };

        // Re-require to apply mocks
        delete require.cache[require.resolve("../../module/docker_judger")];
        dockerJudgerClass = require("../../module/docker_judger").default;
        judger = new dockerJudgerClass("/home/judge");
    });

    afterEach(function () {
        Module._load = previousLoad;
        sinon.restore();
    });

    it("should set basic properties", function () {
        judger.setSolutionID(100);
        judger.setLanguage(1);
        judger.setCode("print('hello')");
        judger.setUserID("test_user");

        expect(judger.submit_id).to.equal(100);
        expect(judger.language).to.equal(1);
        expect(judger.code).to.equal("print('hello')");
        expect(judger.user_id).to.equal("test_user");
    });

    it("should convert status codes correctly", function () {
        expect(dockerJudgerClass.parseJudgerCodeToWeb(2)).to.equal(4); // Accepted
        expect(dockerJudgerClass.sandboxCodeToJudger(0)).to.equal(2); // Accepted
    });

    it("should parse language names", function () {
        expect(dockerJudgerClass.parseLanguage(0)).to.equal("c11");
        expect(dockerJudgerClass.parseLanguage(18)).to.equal("python3");
    });

    it("should set problem ID and query limits", async function () {
        queryStub.resolves([{
            time_limit: "1.0",
            memory_limit: "128000"
        }]);

        await judger.setProblemID(1001);

        expect(queryStub.calledWith(sinon.match(/SELECT \* FROM problem/))).to.be.true;
        expect(judger.time_limit).to.equal(1.0);
        // memory_limit is parsed as int in code
        expect(judger.memory_limit).to.equal(128000);
    });

    it("should run judgment flow", async function () {
        judger.setProblemID = sinon.stub().resolves(); // skip db in run test
        judger.problem_id = 1001;
        judger.language = 0;
        judger.code = "code";

        fsPromisesStub.readdir.resolves(["test.in", "test.out"]);

        await judger.run();

        expect(submitStub.pushFileStdin.called).to.be.true;
        expect(submitStub.pushAnswerFiles.called).to.be.true;
        expect(sandboxStub.runner.called).to.be.true;
        expect(submitStub.emit.calledWith("finish")).to.be.true;
    });
});
