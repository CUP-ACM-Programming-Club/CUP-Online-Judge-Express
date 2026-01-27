
process.env.NODE_ENV = "autotest";
const path = require("path");

// 1. Setup Mock Environment
require("../setup/mock-external");
const fakeDb = require("../mocks/fake-db");

// 2. Import Dependencies
import app from "../../app";
const request = require("supertest");
const { expect } = require("chai");
const util = require("../../module/util");

// 3. Mount Routes
require("../../module/init/express_loader")(app);

// 4. Globals
global.contest_mode = false;
global.submissions = [];

// 5. User Credentials
const ADMIN_USER = {
    user_id: "admin",
    password: "password",
    nick: "Admin",
    email: "admin@test.com"
};

describe("Integration Test: Full Flow", function () {
    this.timeout(20000);

    let adminCookie: any;

    before(async function () {
        fakeDb.reset();
        const salt = global.config.salt || "testsalt";
        const adminPass = util.encryptPassword(ADMIN_USER.password, salt);

        // Seed Admin
        await fakeDb.query(`INSERT INTO users (user_id, password, newpassword, nick, email, school, solved, submit, vjudge_solved, vjudge_submit) 
            VALUES (
                '${ADMIN_USER.user_id}', 
                '${adminPass}', 
                '${adminPass}', 
                '${ADMIN_USER.nick}', 
                '${ADMIN_USER.email}',
                'test', 1, 1, 0, 0
            )`);

        // Seed Privilege
        await fakeDb.query(`INSERT INTO privilege (user_id, rightstr) VALUES ('${ADMIN_USER.user_id}', 'administrator')`);

        // Seed Global Setting
        await fakeDb.query(`INSERT INTO global_setting (label, value) VALUES ('contest_mode', 'false')`);

        // Seed Solution (Required for RanklistService to calculate solved count)
        // result = 4 means Accepted
        await fakeDb.query(`INSERT INTO solution (solution_id, user_id, problem_id, result, in_date, language, ip, code_length)
            VALUES (1, '${ADMIN_USER.user_id}', 1001, 4, NOW(), 1, '127.0.0.1', 100)`);
    });

    it("should login as admin", async function () {
        const payload = JSON.stringify({
            user_id: ADMIN_USER.user_id,
            password: ADMIN_USER.password,
            captcha: "1234"
        });
        const b64 = (s: string) => Buffer.from(s).toString("base64");
        const msg = b64(b64(payload));

        const res = await request(app)
            .post("/login")
            .send({ msg });

        if (res.body.status !== "OK") {
            console.log("Login Error:", JSON.stringify(res.body));
        }
        expect(res.body.status).to.equal("OK");
        adminCookie = res.headers["set-cookie"];
    });

    it("should get ranklist", async function () {
        // Try with cookie (Ranklist might be login-protected or auth middleware checks it)
        const res = await request(app).get("/ranklist").set("Cookie", adminCookie);

        if (Array.isArray(res.body.ranklist)) {
            const adminEntry = res.body.ranklist.find((u: any) => u.user_id === ADMIN_USER.user_id);
            if (!adminEntry) {
                console.log("Ranklist content:", JSON.stringify(res.body.ranklist));
            }
            expect(adminEntry).to.exist;
            expect(adminEntry.solved).to.equal(1); // Mapped correctly?
        } else {
            console.log("Ranklist error body:", JSON.stringify(res.body));
            expect(res.body.ranklist).to.be.an("array");
        }
    });

    it("should update global settings", async function () {
        if (!adminCookie) this.skip();
        const res = await request(app)
            .post("/admin/setting")
            .set("Cookie", adminCookie)
            .send({
                contest_mode: "true"
            });

        if (res.body.status !== "OK") {
            console.log("Setting Update Error:", JSON.stringify(res.body));
        }
        expect(res.body.status).to.equal("OK");

        const setting = await fakeDb.query("SELECT * FROM global_setting WHERE label = 'contest_mode'");
        expect(setting[0].value).to.equal("true");
    });
});
