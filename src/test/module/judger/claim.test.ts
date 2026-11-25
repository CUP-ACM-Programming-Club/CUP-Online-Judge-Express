import { expect } from "chai";
import sinon from "sinon";
import Module from "module";

describe("MySqlJudgeQueueRepository.claimForJudging", function () {
    let queryStub: sinon.SinonStub;
    let previousLoad: any;
    let repo: any;
    const modPath = require.resolve("../../../infrastructure/persistence/submission/MySqlJudgeQueueRepository");

    beforeEach(function () {
        queryStub = sinon.stub();
        previousLoad = (Module as any)._load;
        (Module as any)._load = function (request: string) {
            if (request.includes("mysql/MySQLManager")) return { MySQLManager: { execQuery: queryStub } };
            return previousLoad.apply(this, arguments);
        };
        delete require.cache[modPath];
        const m = require(modPath);
        repo = new m.MySqlJudgeQueueRepository();
    });

    afterEach(function () {
        (Module as any)._load = previousLoad;
        delete require.cache[modPath];
        sinon.restore();
    });

    it("claims only waiting / rejudge / lease-expired rows in one atomic UPDATE", async () => {
        queryStub.resolves({ affectedRows: 1 });
        const ok = await repo.claimForJudging(42, 300);
        expect(ok).to.equal(true);
        const [sql, args] = queryStub.firstCall.args;
        expect(sql).to.match(/^UPDATE solution SET result = 14, judgetime = NOW\(\) WHERE solution_id = \?/);
        expect(sql).to.include("result IN (0, 1)");
        expect(sql).to.include("result = 14 AND judgetime < NOW() - INTERVAL ? SECOND");
        expect(args).to.deep.equal([42, 300]);
    });

    it("returns false when another server already claimed it", async () => {
        queryStub.resolves({ affectedRows: 0 });
        expect(await repo.claimForJudging(42, 300)).to.equal(false);
    });
});
