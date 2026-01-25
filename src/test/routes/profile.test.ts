/**
 * Profile Route Unit Tests with Closure Control & Manual Recording
 */

const expect = require("chai").expect;
const sinon = require("sinon");
const Module = require("module");

describe("Profile Route Tests (Full Coverage)", function () {
    let router;
    let queryStub;
    let checkPasswordStub;
    let loginActionStub;
    let utilStub;
    let constVarStub;
    let previousLoad;
    let handler;

    // Control variables
    let shouldCheckPasswordPass = true;
    let shouldQueryFail = false;
    let mockQueryCalls = [];

    const mockConfig = {
        salt: "testsalt"
    };

    beforeEach(function () {
        shouldCheckPasswordPass = true;
        shouldQueryFail = false;
        mockQueryCalls = [];

        // 1. Setup Stubs
        queryStub = sinon.stub().callsFake(async (sql, params) => {
            mockQueryCalls.push({ sql, params });
            if (sql && typeof sql === "string" && sql.toLowerCase().includes("select password")) {
                return [{ password: "mock_password_hash", newpassword: "mock_new_password_hash" }];
            }
            if (shouldQueryFail) {
                throw new Error("DB Error");
            }
            return { affectedRows: 1, insertId: 0, warningCount: 0, message: "" };
        });

        checkPasswordStub = sinon.stub().callsFake((...args) => {
            return shouldCheckPasswordPass;
        });

        loginActionStub = sinon.stub().resolves();
        utilStub = {
            encryptPassword: sinon.stub().callsFake((pwd, salt) => `encrypted_${pwd}_${salt}`)
        };
        constVarStub = [
            { // error
                invalidParams: { status: "error", statement: "invalid params" },
                errorMaker: (msg) => ({ status: "error", statement: msg }),
                database: { status: "error", statement: "database error" }
            },
            { // ok
                ok: { status: "OK" }
            }
        ];

        // 2. Intercept Module._load
        previousLoad = Module._load;
        Module._load = function (request, parent, isMain) {
            if (request.includes("mysql_query")) return queryStub;
            if (request.includes("check_password")) return checkPasswordStub;
            if (request.includes("login_action")) return loginActionStub;
            if (request.includes("module/util")) return utilStub;
            if (request.includes("const_var")) return constVarStub;
            return previousLoad.apply(this, arguments);
        };

        // 3. Setup Global Config
        global.config = mockConfig;

        // 4. Clear Cache & Load Module
        Object.keys(require.cache).forEach(key => {
            if (key.includes("routes/user/update/profile")) {
                delete require.cache[key];
            }
        });

        const profileModule = require("../../routes/user/update/profile");
        router = profileModule[1];
        handler = router.stack.find(layer => layer.route && layer.route.methods.post).route.stack[0].handle;
    });

    afterEach(function () {
        if (previousLoad) Module._load = previousLoad;
        sinon.restore();
    });

    const createReq = (body) => ({
        body: body || {},
        session: { user_id: 'test_user_id' }
    });

    const createRes = () => {
        const res = {
            json: sinon.spy()
        };
        return res;
    };

    describe("Input Validation", function () {
        it("should reject if parameter length check fails", async function () {
            const req = createReq({ nick: "a".repeat(101), password: "old" });
            const res = createRes();
            await handler(req, res);
            expect(res.json.calledWith(sinon.match({ status: "error" }))).to.be.true;
        });

        it("should valid inputs pass validation", async function () {
            const req = createReq({ nick: "valid", password: "old" });
            const res = createRes();
            await handler(req, res);
            expect(res.json.calledWith(sinon.match({ status: "OK" }))).to.be.true;
        });
    });

    describe("Password Validation", function () {
        it("should reject if old password check fails", async function () {
            shouldCheckPasswordPass = false; // Set control variable
            const req = createReq({ password: "wrong" });
            const res = createRes();
            await handler(req, res);

            expect(res.json.calledWith(sinon.match({ status: "error", statement: "Password wrong" }))).to.be.true;
        });

        it("should reject if passwords mismatch", async function () {
            shouldCheckPasswordPass = true;
            const req = createReq({ password: "old", newpassword: "a", repeatpassword: "b" });
            const res = createRes();
            await handler(req, res);

            expect(res.json.calledWith(sinon.match({ status: "error", statement: "Two password not same" }))).to.be.true;
        });
    });

    describe("Update Logic", function () {
        it("should execute updates when password valid", async function () {
            shouldCheckPasswordPass = true;
            const req = createReq({ password: "old", nick: "newnick" });
            const res = createRes();
            await handler(req, res);

            expect(res.json.calledWith(sinon.match({ status: "OK" }))).to.be.true;

            // Verify verification call manually using our captured calls
            const hasUpdate = mockQueryCalls.some(call => call.sql && call.sql.toLowerCase().includes("update users set"));
            expect(hasUpdate, "Should have called update query").to.be.true;
        });

        it("should handle db error", async function () {
            shouldCheckPasswordPass = true;
            shouldQueryFail = true;

            const req = createReq({ password: "old", nick: "newnick" });
            const res = createRes();
            await handler(req, res);

            expect(res.json.calledWith(sinon.match({ status: "error", statement: "database error" }))).to.be.true;
        });
    });
});
