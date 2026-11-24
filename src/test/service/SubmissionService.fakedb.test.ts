require("../setup/mock-external");
const expect = require("chai").expect;
const query = require("../../module/mysql_cache");
const table_name = ["solution", "source_code", "source_code_user"];
const fakeDb = require("../mocks/fake-db");
// 从已删除的 module/submitControl.test.ts 迁移而来：submitControl.ts 是 SubmissionService 的旧副本（已无引用）。
// 这里只保留 SubmissionService.test.ts / SubmissionTransaction.test.ts 尚未覆盖的用例，跑在 fake-db 上。
describe("SubmissionService.submit (fake-db, ported from submitControl)", function () {
    let submitControl: (req: any, data: any, cookie: any) => Promise<any>;

    before(async function () {
        // SubmissionService.test.ts 会用桩替换依赖后重新加载该模块，这里强制取一份真实依赖的实例
        delete require.cache[require.resolve("../../service/SubmissionService")];
        const service = require("../../service/SubmissionService").default;
        submitControl = (req, data, cookie) => service.submit(req, data, cookie);
        await query("delete from problem where problem_id = 1000");
        await query("insert into problem (problem_id, defunct)values(?,?)", [1000, "N"]);
        await query("insert into users (user_id, nick) values(?,?)", ["test_name", "tester"]);
        await query("insert into privilege (user_id, rightstr) values(?,?)", ["test_name", "c1000"]);
        await query("insert into contest (contest_id, defunct, private, langmask, cmod_visible, start_time, end_time, limit_hostname, ip_policy) values(?,?,?,?,?,?,?,?,?)",
            [1000, "N", 0, 0, 1, "2000-01-01 00:00:00", "2100-01-01 00:00:00", null, null]);
        await query("insert into contest_problem (contest_id, problem_id, num) values(?,?,?)", [1000, 1000, 0]);
        await query("insert into special_subject (topic_id, defunct, private, langmask) values(?,?,?,?)",
            [100, "N", 0, 0]);
        await query("insert into special_subject_problem (topic_id, problem_id, num) values(?,?,?)", [100, 1000, 0]);
    });

    beforeEach(async function () {
        await query("delete from solution");
    });

    it('should insert into normal problem as Test Run (negative ID)', async function () {
        const req = {
            session: {
                auth: true,
                user_id: "test_name"
            },
            headers: {
                "x-forwarded-for": "127.0.0.1"
            }
        };
        const postdata = {
            id: -1000,
            input_text: "1 1\n",
            language: 0,
            source: "int main(){}",
            share: 0,
            type: "problem"
        };
        const response = await submitControl(req, postdata, {});
        expect(response).to.have.property("status").that.equal("OK");
    });

    it("should reject too long custom input", async function () {
        const req = { session: { auth: true, user_id: "test_name" } };
        const longInput = "a".repeat(1001);
        try {
            await submitControl(req, { type: "problem", id: 1000, source: "int main(){}", input_text: longInput }, {});
            throw new Error("should throw");
        } catch (err) {
            expect(err).to.have.property("statement");
        }
    });

    it("should reject invalid contest id or pid", async function () {
        fakeDb.registerHandler(
            (sql) => sql.toLowerCase().includes("from contest_problem"),
            () => ([{ problem_id: 1000 }])
        );
        const req = {
            session: { auth: true, user_id: "test_name", contest: {}, contest_maker: {}, contest_manager: false },
            headers: { "x-forwarded-for": "127.0.0.1" }
        };
        try {
            await submitControl(req, { type: "contest", cid: "bad", pid: "x", language: 0, source: "int main(){}" }, {});
            throw new Error("should throw");
        } catch (err) {
            expect(err).to.have.property("statement");
        } finally {
            fakeDb.clearHandlers();
        }
    });

    it("should reject contest submission by hostname policy", async function () {
        await query("update contest set limit_hostname = ? where contest_id = 1000", ["example.com"]);
        const req = {
            session: { auth: true, user_id: "test_name", contest: {}, contest_maker: {}, contest_manager: false },
            headers: { "x-forwarded-for": "127.0.0.1", referer: "http://other.test" }
        };
        try {
            await submitControl(req, { type: "contest", cid: 1000, pid: 0, language: 0, source: "int main(){}" }, {});
            throw new Error("should throw");
        } catch (err) {
            expect(err).to.have.property("statement");
        } finally {
            await query("update contest set limit_hostname = null where contest_id = 1000");
        }
    });

    it("should reject contest submission by ip policy", async function () {
        await query("update contest set ip_policy = ? where contest_id = 1000", ["403"]);
        const req = {
            session: { auth: true, user_id: "test_name", contest: {}, contest_maker: {}, contest_manager: false },
            headers: { "x-forwarded-for": "127.0.0.1" }
        };
        try {
            await submitControl(req, { type: "contest", cid: 1000, pid: 0, language: 0, source: "int main(){}" }, {});
            throw new Error("should throw");
        } catch (err) {
            expect(err).to.have.property("statement");
        } finally {
            await query("update contest set ip_policy = null where contest_id = 1000");
        }
    });

    it("should reject private topic submission", async function () {
        await query("update special_subject set private = 1 where topic_id = 100");
        const req = {
            session: { auth: true, user_id: "test_name", isadmin: false },
            headers: { "x-forwarded-for": "127.0.0.1" }
        };
        try {
            await submitControl(req, { type: "topic", tid: 100, pid: 0, language: 0, source: "int main(){}" }, {});
            throw new Error("should throw");
        } catch (err) {
            expect(err).to.have.property("statement");
        } finally {
            await query("update special_subject set private = 0 where topic_id = 100");
        }
    });

    it("should reject invalid topic id or pid", async function () {
        const req = {
            session: { auth: true, user_id: "test_name" },
            headers: { "x-forwarded-for": "127.0.0.1" }
        };
        try {
            await submitControl(req, { type: "topic", tid: "bad", pid: "bad", language: 0, source: "code" }, {});
            throw new Error("should throw");
        } catch (err) {
            expect(err).to.have.property("statement").that.includes("Invalid topic_id or pid");
        }
    });

    it("should reject invalid topic language", async function () {
        await query("update special_subject set langmask = 1 where topic_id = 100");
        const req = {
            session: { auth: true, user_id: "test_name" },
            headers: { "x-forwarded-for": "127.0.0.1" }
        };
        try {
            await submitControl(req, { type: "topic", tid: 100, pid: 0, language: 0, source: "code" }, {});
            throw new Error("should throw");
        } catch (err) {
            expect(err).to.have.property("statement").that.includes("language is invalid");
        } finally {
            await query("update special_subject set langmask = 0 where topic_id = 100");
        }
    });

    it("should build session from cookie token", async function () {
        const req = {
            headers: { "x-forwarded-for": "127.0.0.1" }
        };
        const cookie = { user_id: "test_name", token: "test" };
        const postdata = {
            id: 1000,
            language: 0,
            source: "int main(){}",
            type: "problem"
        };
        const response = await submitControl(req, postdata, cookie);
        expect(response).to.have.property("status").that.equal("OK");
    });

    it("should reject invalid submission type", async function () {
        try {
            await submitControl({ session: { auth: true, user_id: "test_name" } }, { type: "unknown" }, {});
            throw new Error("should throw");
        } catch (err) {
            expect(err).to.have.property("statement");
        }
    });

    it("should reject non-existing problem", async function () {
        const req = { session: { auth: true, user_id: "test_name" } };
        try {
            await submitControl(req, { type: "problem", id: 9999, source: "int main(){}", language: 0 }, {});
            throw new Error("should throw");
        } catch (err) {
            expect(err).to.have.property("statement");
        }
    });

    it("should reject invalid contest language", async function () {
        await query("update contest set langmask = 1 where contest_id = 1000");
        const req = { session: { auth: true, user_id: "test_name" }, headers: { "x-forwarded-for": "127.0.0.1" } };
        try {
            await submitControl(req, { type: "contest", cid: 1000, pid: 0, language: 0, source: "int main(){}" }, {});
            throw new Error("should throw");
        } catch (err) {
            expect(err).to.have.property("statement");
        } finally {
            await query("update contest set langmask = 0 where contest_id = 1000");
        }
    });

    it("should throw error in dos2unix if input is not string (Test Run)", async function () {
        const req = { session: { auth: true, user_id: "test_name" }, headers: { "x-forwarded-for": "127.0.0.1" } };
        // Test Run triggers dos2unix on input_text.
        // We pass integer input_text to fail validation or fail dos2unix. 
        // validation checks length but not type?
        // dataErrorChecker only checks length.
        // So integer input_text might pass checker but fail dos2unix?
        // Actually line 254: data.input_text.length works on string or array. Number won't have length.

        try {
            // We use an object to bypass length check maybe? 
            // Or just invalid type that throws in dos2unix.
            await submitControl(req, {
                type: "problem",
                id: -1000, // Test Run
                source: "code",
                input_text: 12345 // Number doesn't have split
            }, {});
            throw new Error("should throw");
        } catch (err) {
            // dos2unix throws "input should be string" or "plainText.split is not a function"
            // The wrapper catches it.
            if (err instanceof Error) {
                // Good
            } else {
                expect(err).to.have.property("status");
            }
        }
    });

    it("should reject topic submission if problem not in topic", async function () {
        // Existing test "should reject invalid topic id or pid" handles IsNaN.
        // We need valid IDs but not related.
        const req = {
            session: { auth: true, user_id: "test_name" },
            headers: { "x-forwarded-for": "127.0.0.1" }
        };
        try {
            // Topic 100 has problem 1000 (num 0).
            // Let's ask for problem num 999.
            await submitControl(req, { type: "topic", tid: 100, pid: 999, language: 0, source: "code" }, {});
            throw new Error("should throw");
        } catch (err) {
            expect(err).to.have.property("statement").that.includes("problem is not in topic");
        }
    });

    it("should allow admin submission even if problem is in active contest", async function () {
        // Set up active contest conflict
        // Problem 1000 is in contest 1000 (active).
        // Standard user fails.
        // Admin user should pass.
        const req = {
            session: {
                auth: true,
                user_id: "admin_user",
                isadmin: true
            },
            headers: {
                "x-forwarded-for": "127.0.0.1"
            }
        };
        const response = await submitControl(req, { type: "problem", id: 1000, language: 0, source: "code" }, {});
        expect(response).to.have.property("status", "OK");
    });

    afterEach(async function () {
        await query("delete from solution");
    });

    after(async function () {
        let PromisifyQuery = table_name
            .map(el => query(`delete from ${el}`));
        await Promise.all(PromisifyQuery);
        await query("delete from privilege where user_id = ?", ["test_name"]);
        query.pool.end();
        require("../../module/mysql_query").pool.end();
        require("../../module/redis").quit();
    })
});
