
import { expect } from "chai";
import sinon from "sinon";
import Module from "module";

describe("AdminProblemService Tests", function () {
    let AdminProblemService: any;
    let queryStub: sinon.SinonStub;
    let rejudgeStub: any;
    let problemFileManagerStub: any;
    let previousLoad: any;

    beforeEach(function () {
        // 1. Setup Stubs
        queryStub = sinon.stub().resolves([]);

        rejudgeStub = {
            rejudgeByContest: sinon.stub().resolves(),
            rejudgeBySolution: sinon.stub().resolves(),
            rejudgeByProblem: sinon.stub().resolves(),
            rejudgeContest: sinon.stub().resolves(),
            rejudgeSolution: sinon.stub().resolves(),
            rejudgeProblem: sinon.stub().resolves()
        };

        problemFileManagerStub = {
            getFilePath: sinon.stub().returns("/path/to/file")
        };

        // 2. Intercept Module._load
        previousLoad = (Module as any)._load;
        (Module as any)._load = function (request: string, parent: any, isMain: boolean) {
            // console.log("Req:", request);
            if (request.includes("mysql_query")) return queryStub;
            if (request.includes("module/status/update_solution_result")) return rejudgeStub;
            if (request.includes("ProblemFileManager")) {
                // Support both check 
                (problemFileManagerStub as any).default = problemFileManagerStub;
                return problemFileManagerStub;
            }

            return previousLoad.apply(this, arguments);
        };

        // 3. Re-require Service
        Object.keys(require.cache).forEach(key => {
            const normalized = key.replace(/\\/g, "/");
            if (normalized.includes("module/status/update_solution_result") || normalized.includes("service/admin/AdminProblemService")) {
                delete require.cache[key];
            }
        });
        AdminProblemService = require("../../../service/admin/AdminProblemService").default;
    });

    afterEach(function () {
        if (previousLoad) (Module as any)._load = previousLoad;
        sinon.restore();
    });

    describe("getProblemList", () => {
        it("should return problem list", async () => {
            queryStub.withArgs(sinon.match(/select \* from problem/)).resolves([{ problem_id: 1000 }]);
            queryStub.withArgs(sinon.match(/select count\(1\)/)).resolves([{ cnt: 50 }]);

            const result = await AdminProblemService.getProblemList(0, 20);
            expect(result.data).to.have.lengthOf(1);
            expect(result.count).to.equal(50);
        });

        it("should handle custom where and order", async () => {
            queryStub.resolves([{ cnt: 0 }]);
            queryStub.onCall(0).resolves([]);

            await AdminProblemService.getProblemList(0, 20, { where: "w", order: "o" });
            const sql = queryStub.firstCall.args[0];
            expect(sql).to.include("w");
            expect(sql).to.include("o");
        });
    });

    describe("toggleProblemDefunct", () => {
        it("should toggle Y to N", async () => {
            queryStub.onCall(0).resolves([{ defunct: "Y" }]);
            const res = await AdminProblemService.toggleProblemDefunct(1000);
            expect(res).to.equal("N");
            expect(queryStub.calledTwice).to.be.true; // select + update
        });

        it("should toggle N to Y", async () => {
            queryStub.onCall(0).resolves([{ defunct: "N" }]);
            const res = await AdminProblemService.toggleProblemDefunct(1000);
            expect(res).to.equal("Y");
        });
    });

    describe("Rejudge Wrappers", () => {
        it("should trigger rejudgeContest", async () => {
            await AdminProblemService.rejudgeContest(1000);
            expect(rejudgeStub.rejudgeContest.calledWith(1000)).to.be.true;
        });

        it("should trigger rejudgeSolution", async () => {
            await AdminProblemService.rejudgeSolution(100);
            expect(rejudgeStub.rejudgeSolution.calledWith(100)).to.be.true;
        });

        it("should trigger rejudgeProblem", async () => {
            await AdminProblemService.rejudgeProblem(1000);
            expect(rejudgeStub.rejudgeProblem.calledWith(1000)).to.be.true;
        });
    });

    describe("getProblemDataPath", () => {
        it("should return file path", () => {
            const path = AdminProblemService.getProblemDataPath(1000, "1.in");
            expect(path).to.equal("/path/to/file");
            expect(problemFileManagerStub.getFilePath.calledWith(1000, "1.in")).to.be.true;
        });
    });
});
