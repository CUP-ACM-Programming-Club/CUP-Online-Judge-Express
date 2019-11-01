const expect = require("chai").expect;
const query = require("../../module/mysql_cache");

async function removeAll() {
    await query("delete from users where user_id = 'test' or nick = 'test' or nick = 'test1'");
    await query("delete from privilege where user_id = 'test'");
    await query("delete from solution where user_id = 'test'");
    await query("delete from contest where contest_id = 1000");
    await query("delete from source_code");
}

function afterAll() {
    require("../../module/mysql_cache").pool.end();
    require("../../module/mysql_query").pool.end();
    require("../../module/redis").quit();
}

describe("test privilege", function(){
    let server;
    server = require("../../app");
    require("../../module/init/build_env")(true);
    require("../../module/init/express_loader")(server);
    const request = require("supertest").agent(server);
    before(async function(){
        await removeAll();
        await query("insert into users (user_id,password) values(?,?)",
            ["test", "ZNs/zvia7mVswcknwoXWOiuNwJUyMDg1"]);
        await query(`insert into privilege (user_id,rightstr,defunct)values('test','administrator','N')`);
        await query(`insert into source_code(solution_id, source)values(?,?)`,
            [1000, "console.log('hello world')"]);
        await query(`insert into contest (contest_id)values(?)`,[1000]);
        await query(`INSERT INTO solution (solution_id, problem_id, user_id, time, memory, in_date, result, language, ip, contest_id, topic_id, valid, pass_point, num, code_length, judgetime, pass_rate, judger, share, fingerprint, fingerprintRaw) VALUES (1000, 1000, 'test', 1, 2040, '2015-12-09 22:02:36', 4, 1, '10.10.12.143', 1000, null, 1, 2, 0, 182, '2017-12-19 20:45:28', 1.00, '鹤望兰号', 0, null, null);`);
        await new Promise((done) => {
            let data = {
                user_id: "test",
                password: "123456"
            };
            request
                .post("/login")
                .send({
                    msg: Buffer.from(Buffer.from(JSON.stringify(data)).toString("base64")).toString("base64")
                })
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        done(err);
                    }
                    done();
                })
        });
    });

    it('should return privilege JSON data', function (done) {
        request
            .get("/privilege")
            .expect(200)
            .end(function(err, res) {
                expect(res.body).to.have.ownProperty("status").that.equal("OK");
                expect(res.body).to.have.ownProperty("data").that.have.ownProperty("admin").that.equal(true);
                done();
            })
    });

    after(async function() {
        await afterAll();
        await removeAll();
    })
});
