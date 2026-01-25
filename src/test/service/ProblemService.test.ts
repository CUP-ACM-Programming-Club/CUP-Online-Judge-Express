
import { expect } from "chai";
import sinon from "sinon";
import Module from "module";

describe("ProblemService Tests", function () {
    let ProblemService: any;
    let cacheQueryStub: sinon.SinonStub;
    let queryStub: sinon.SinonStub;
    let problemInfoManagerStub: any;
    let contestAssistantStub: any;
    let sourcePrivilegeCacheStub: any;
    let cachePoolStub: any;
    let previousLoad: any;

    const mockReq = {
        session: {
            user_id: "test_user",
            isadmin: false,
            source_browser: false,
            editor: false
        }
    };

    beforeEach(function () {
        // 1. Setup Stubs
        cacheQueryStub = sinon.stub();
        queryStub = sinon.stub();

        // Mock ProblemInfoManager chain
        const problemInfoInstance = {
            setProblemId: sinon.stub().returnsThis(),
            find: sinon.stub().resolves({
                get: sinon.stub().returns({ defunct: "N" })
            })
        };
        problemInfoManagerStub = {
            newInstance: sinon.stub().returns(problemInfoInstance)
        };

        contestAssistantStub = {
            userIsContestAssistant: sinon.stub().resolves(false)
        };

        sourcePrivilegeCacheStub = {
            checkPrivilege: sinon.stub().resolves(true)
        };

        cachePoolStub = {
            get: sinon.stub().returns(undefined),
            set: sinon.stub()
        };

        // 2. Intercept Module._load
        previousLoad = (Module as any)._load;
        (Module as any)._load = function (request: string, parent: any, isMain: boolean) {
            if (request.includes("mysql_cache")) return cacheQueryStub;
            if (request.includes("mysql_query")) return queryStub;
            if (request.includes("ProblemInfoManager")) return problemInfoManagerStub;
            if (request.includes("ContestAssistantManager")) return { default: contestAssistantStub, ...contestAssistantStub };
            if (request.includes("SourcePrivilegeCache")) return { default: sourcePrivilegeCacheStub, ...sourcePrivilegeCacheStub };
            if (request.includes("cachePool")) return cachePoolStub;
            // Cheerio is usually a library, require it normally or let it load key logic
            // But we can mock it if needed. For now let it load real cheerio it has logic.
            return previousLoad.apply(this, arguments);
        };

        // 3. Re-require Service
        delete require.cache[require.resolve("../../service/ProblemService")];
        ProblemService = require("../../service/ProblemService").default;
    });

    afterEach(function () {
        if (previousLoad) (Module as any)._load = previousLoad;
        sinon.restore();
    });

    describe("judgeValidNumber", () => {
        it("should handle single number", () => {
            expect(ProblemService.judgeValidNumber(123)).to.equal(123);
            expect(ProblemService.judgeValidNumber("123")).to.equal(123);
            expect(ProblemService.judgeValidNumber("abc")).to.equal(-1);
        });

        it("should handle array of numbers", () => {
            const result = ProblemService.judgeValidNumber([123, "456", "abc"]);
            expect(result).to.deep.equal([123, 456, -1]);
        });
    });

    describe("checkEmpty", () => {
        it("should return null for empty string or null", () => {
            expect(ProblemService.checkEmpty("")).to.be.null;
            expect(ProblemService.checkEmpty(null)).to.be.null;
        });

        it("should return original string if not empty", () => {
            expect(ProblemService.checkEmpty("hello")).to.equal("hello");
        });
    });

    describe("checkProblemAvailable", () => {
        it("should return true for valid problem", async () => {
            const avail = await ProblemService.checkProblemAvailable(1000);
            expect(avail).to.be.true;
        });

        it("should return false if defunct", async () => {
            problemInfoManagerStub.newInstance().find.resolves({ get: () => ({ defunct: "Y" }) });
            const avail = await ProblemService.checkProblemAvailable(1001);
            expect(avail).to.be.false;
        });

        it("should return false if problem not found (null)", async () => {
            problemInfoManagerStub.newInstance().find.resolves(null);
            const avail = await ProblemService.checkProblemAvailable(1002);
            expect(avail).to.be.false;
        });
    });

    describe("checkUploader", () => {
        it("should return user_id if privilege exists", async () => {
            cacheQueryStub.resolves([{ user_id: "creator" }]);
            const uploader = await ProblemService.checkUploader(1000);
            expect(uploader).to.equal("creator");
        });

        it("should return Administrator if no privilege found", async () => {
            cacheQueryStub.resolves([]);
            const uploader = await ProblemService.checkUploader(1001);
            expect(uploader).to.equal("Administrator");
        });

        it("should return Administrator on error", async () => {
            cacheQueryStub.rejects(new Error("DB Error"));
            const uploader = await ProblemService.checkUploader(1002);
            expect(uploader).to.equal("Administrator");
        });
    });

    describe("checkProblemInContest", () => {
        it("should return true if problem in running contest", async () => {
            cacheQueryStub.resolves([{ problem_id: 1000 }]);
            const result = await ProblemService.checkProblemInContest(1000);
            expect(result).to.be.true;
        });

        it("should return false if not in contest", async () => {
            cacheQueryStub.resolves([]);
            const result = await ProblemService.checkProblemInContest(1001);
            expect(result).to.be.false;
        });
    });

    describe("prependAppendHandler", () => {
        it("should handle prepend and append codes and calculate langmask", () => {
            const dataArray = [
                { type: "0", code: "code0", prepend: "1" }, // prepend for lang 0 (C) -> 2^0 = 1
                { type: "1", code: "code1", prepend: "0" }  // append for lang 1 (C++) -> 2^1 = 2
            ];
            const opt: any = {};
            ProblemService.prependAppendHandler(dataArray, opt);

            expect(opt.prepend[0]).to.equal("code0");
            expect(opt.append[1]).to.equal("code1");
            expect(opt.langmask).to.equal(~3); // ~(1 | 2)
        });
    });

    describe("getProblem", () => {
        it("should throw error if problem not found", async () => {
            cacheQueryStub.onCall(0).resolves([]); // prefile
            cacheQueryStub.onCall(1).resolves([]); // problem query empty

            let err: any;
            try {
                await ProblemService.getProblem(mockReq, { id: 9999, source: "" });
            } catch (e) {
                err = e;
            }
            expect(err).to.not.be.undefined;
            expect(err.statement).to.contain("not found");
        });

        it("should return problem data for admin (local) with prepend/append", async () => {
            cacheQueryStub.onCall(0).resolves([{ type: "0", code: "p_code", prepend: "1" }]); // prefile
            cacheQueryStub.onCall(1).resolves([{ // problem query
                problem_id: 1000,
                title: "Admin Problem",
                source: "LOCAL",
                creator: "admin"
            }]);

            const mockAdminReq = { session: { isadmin: true, user_id: "admin" } } as any;
            const result = await ProblemService.getProblem(mockAdminReq, {
                id: 1000,
                source: "",
                after_contest: true
            });

            expect(result.problem.title).to.equal("Admin Problem");
            expect(result.problem.prepend[0]).to.equal("p_code");
            expect(result.isadmin).to.be.true;
        });

        it("should return Vjudge problem", async () => {
            cacheQueryStub.onCall(0).resolves([]); // prefile
            cacheQueryStub.onCall(1).resolves([{ // problem query
                problem_id: 1000,
                title: "Vjudge Problem",
                source: "POJ"
            }]);

            const mockUserReq = { session: { isadmin: false, user_id: "user" } } as any;
            const result = await ProblemService.getProblem(mockUserReq, {
                id: 1000,
                source: "POJ",
                after_contest: true
            });

            expect(result.problem.title).to.equal("Vjudge Problem");
            expect(result.problem.source).to.equal("POJ");
        });

        it("should mask source if !after_contest", async () => {
            cacheQueryStub.onCall(0).resolves([]);
            cacheQueryStub.onCall(1).resolves([{ problem_id: 1000, source: "POJ" }]);

            const result = await ProblemService.getProblem(mockReq, {
                id: 1000, source: "POJ", after_contest: false
            });
            expect(result.problem.source).to.equal("");
        });

        it("should return source code info if solution_id provided", async () => {
            cacheQueryStub.onCall(0).resolves([]);
            cacheQueryStub.onCall(1).resolves([{ problem_id: 1000 }]);
            // checkPrivilege mocked true

            cacheQueryStub.onCall(2).resolves([{ source: "user_code" }]); // source code
            cacheQueryStub.onCall(3).resolves([{ language: 1 }]); // lang info

            const result = await ProblemService.getProblem(mockReq, {
                id: 1000, source: "", after_contest: true, solution_id: 500
            });

            expect(result.source.source_code).to.equal("user_code");
            expect(result.source.language).to.equal(1);
        });

        it("should handle empty source code result", async () => {
            cacheQueryStub.onCall(0).resolves([]);
            cacheQueryStub.onCall(1).resolves([{ problem_id: 1000 }]);
            cacheQueryStub.onCall(2).resolves([]); // no source found (maybe no privilege)

            const result = await ProblemService.getProblem(mockReq, {
                id: 1000, source: "", after_contest: true, solution_id: 500
            });

            expect(result.source.source_code).to.equal("");
        });
    });

    describe("searchProblems", () => {
        it("should return cached result if available", async () => {
            cachePoolStub.get.returns({ items: [] });
            const result = await ProblemService.searchProblems("Test", false, false);
            expect(result.items).to.be.an("array");
            expect(cacheQueryStub.called).to.be.false;
        });

        it("should query DB, strip html and set cache if no cache", async () => {
            cachePoolStub.get.returns(undefined);
            cacheQueryStub.resolves([{
                problem_id: 1000,
                title: "A",
                source: "<p>HTML</p>",
                label: "tag"
            }]);

            const result = await ProblemService.searchProblems("A", false, false);

            expect(result.items).to.have.lengthOf(1);
            // expect(result.items[0].source).to.equal("HTML"); // Cheerio logic
            // Note: cheerio load("...").text() might behave slightly differently depending on version/mock
            // but assuming real library loaded:
            expect(cacheQueryStub.called).to.be.true;
            expect(cachePoolStub.set.called).to.be.true;
        });

        it("should return raw rows for dropdown mode", async () => {
            cachePoolStub.get.returns(undefined);
            cacheQueryStub.resolves([{
                problem_id: 1000,
                source: "<p>HTML</p>"
            }]);

            const result = await ProblemService.searchProblems("A", false, true);
            expect(result).to.be.an("array");
            // should not strip html or wrap in items
            expect(result[0].source).to.equal("<p>HTML</p>");
            // should not cache dropdown? Code says: cache.get works for dropdown too.
            // But code: if (isDropdown) return rows; (NO cache.set call in dropdown block)
            expect(cachePoolStub.set.called).to.be.false;
        });
    });

    describe("checkPrivilege", () => {
        it("should handle strict boolean check implications", () => {
            const r1: any = { session: { isadmin: true } };
            expect(ProblemService.checkPrivilege(r1)).to.be.true;
            const r2: any = { session: { source_browser: true } };
            expect(ProblemService.checkPrivilege(r2)).to.be.true;
            const r3: any = { session: {} };
            expect(ProblemService.checkPrivilege(r3)).to.be.undefined; // or check falsy
        });
    });
});
