const expect = require("chai").expect;
const query = require("../../module/mysql_cache");
const table_name = ["solution", "source_code", "source_code_user"];
const submitControl = require("../../module/submitControl");
describe("test submit controller", function () {

    before(async function(){
        await query("delete from problem where problem_id = 1000");
        await query("insert into problem (problem_id)values(1000)");
    });

    beforeEach(async function () {
        await query("delete from solution");
    });

    it('should insert into normal problem', async function () {
        const req = {
            session: {
                auth: true,
                user_id: "test_name"
            },
            headers:{
                "x-forwarded-for": "127.0.0.1"
            }
        };
        const postdata = {
            id: 1000,
            cid: undefined,
            tid: undefined,
            pid: undefined,
            input_text: "1 1\n",
            language: 0,
            source: "#include <iostream>\nusing namespace std;\nint main(){}",
            share: 0,
            type: "problem",
            fingerprintRaw: "fingerprintRaw",
            fingerprint: "fingerprint"
        };
        const response = await submitControl(req, postdata, {});
        expect(response).to.have.property("status")
            .that.equal("OK");
        expect(response).to.have.property("solution_id")
            .that.is.a("number");
    });

    afterEach(async function () {
        await query("delete from solution");
    });

    after(async function () {
       let PromisifyQuery = table_name
           .map(el => query(`delete from ${el}`));
        await Promise.all(PromisifyQuery);
        query.pool.end();
        require("../../module/redis").quit();
    })
});