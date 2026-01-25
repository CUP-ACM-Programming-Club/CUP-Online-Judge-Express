
import { expect } from "chai";
import sinon from "sinon";
import Module from "module";

describe("AdminUserService Tests", function () {
    let AdminUserService: any;
    let queryStub: sinon.SinonStub;
    let utilStub: any;
    let previousLoad: any;

    beforeEach(function () {
        // 1. Setup Stubs
        queryStub = sinon.stub().resolves([]);

        utilStub = {
            generateNewEncryptPassword: sinon.stub().resolves()
        };

        // 2. Intercept Module._load
        previousLoad = (Module as any)._load;
        (Module as any)._load = function (request: string, parent: any, isMain: boolean) {
            if (request.includes("mysql_query")) return queryStub;
            // module/util import
            if (request.endsWith("module/util")) return utilStub;

            return previousLoad.apply(this, arguments);
        };

        // 3. Re-require Service
        delete require.cache[require.resolve("../../../service/admin/AdminUserService")];
        AdminUserService = require("../../../service/admin/AdminUserService").default;
    });

    afterEach(function () {
        if (previousLoad) (Module as any)._load = previousLoad;
        sinon.restore();
    });

    describe("getUserList", () => {
        it("should return user list", async () => {
            queryStub.withArgs(sinon.match(/select \* from users/)).resolves([{ user_id: "u1" }]);
            queryStub.withArgs(sinon.match(/select count\(1\)/)).resolves([{ cnt: 10 }]);

            const result = await AdminUserService.getUserList(0, 20);
            expect(result.data).to.have.lengthOf(1);
            expect(result.count).to.equal(10);
        });

        it("should handle custom where and order", async () => {
            queryStub.resolves([{ cnt: 0 }]);
            queryStub.onCall(0).resolves([]);

            await AdminUserService.getUserList(0, 20, { where: "w", order: "o" });

            const sql = queryStub.firstCall.args[0];
            expect(sql).to.include("w");
            expect(sql).to.include("o");
        });
    });

    describe("toggleUserDefunct", () => {
        it("should toggle Y to N", async () => {
            queryStub.onCall(0).resolves([{ defunct: "Y" }]);
            const res = await AdminUserService.toggleUserDefunct("u1");
            expect(res).to.equal("N");
            expect(queryStub.calledTwice).to.be.true;
        });

        it("should toggle N to Y", async () => {
            queryStub.onCall(0).resolves([{ defunct: "N" }]);
            const res = await AdminUserService.toggleUserDefunct("u1");
            expect(res).to.equal("Y");
        });
    });

    describe("updateUserPassword", () => {
        it("should generate new password", async () => {
            await AdminUserService.updateUserPassword("u1", "pass", "salt");
            expect(utilStub.generateNewEncryptPassword.calledWith("u1", "pass", "salt")).to.be.true;
        });
    });
});
