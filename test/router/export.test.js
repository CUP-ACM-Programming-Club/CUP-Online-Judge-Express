const expect = require("chai").expect;
const query = require("../../module/mysql_cache");
const [error] = require("../../module/const_var");
async function removeAll() {
    await query("delete from users where nick = 'test' or nick = 'test1'");
    await query("delete from source_code");
    await query("delete from solution where user_id = 'test'");
}

describe("test export", function () {
    let server;
    server = require("../../app");
    require("../../module/init/build_env")(true);
    require("../../module/init/express_loader")(server);
    const nopriv = require("supertest").agent(server);
    const priv = require("supertest").agent(server);
    before(async function () {
        await removeAll();
        await query("insert into users (user_id,nick,password) values(?,?,?)",
            ["test", "test", "ZNs/zvia7mVswcknwoXWOiuNwJUyMDg1"]);
        await query("insert into users (user_id,nick,password) values(?,?,?)",
            ["test1", "test1", "ZNs/zvia7mVswcknwoXWOiuNwJUyMDg1"]);
        await query("insert into users (user_id,nick,password) values(?,?,?)",
            ["1234566778", "test", "ZNs/zvia7mVswcknwoXWOiuNwJUyMDg1"]);
        await query(`insert into privilege (user_id,rightstr,defunct)values('test','administrator','N')`);
        await query(`insert into source_code(solution_id, source)values(?,?)`,
            [1000, "console.log('hello world')"]);
        await query(`INSERT INTO solution (solution_id, problem_id, user_id, time, memory, in_date, result, language, ip, contest_id, topic_id, valid, pass_point, num, code_length, judgetime, pass_rate, judger, share, fingerprint, fingerprintRaw) VALUES (1000, 1000, 'test', 1, 2040, '2015-12-09 22:02:36', 4, 1, '10.10.12.143', 1000, null, 1, 2, 0, 182, '2017-12-19 20:45:28', 1.00, '鹤望兰号', 0, null, null);`);
        await new Promise((done) => {
            let data = {
                user_id: "test1",
                password: "123456"
            };
            nopriv
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
        await new Promise((done) => {
            let data = {
                user_id: "test",
                password: "123456"
            };
            priv
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

    it("should receive permission denied", function (done) {
        nopriv
            .get("/export/contest_code/1000")
            .expect(200)
            .end(function (err, res) {
                expect(res.body).to.deep.equal(error.noprivilege);
                done();
            });
    });

    it('should receive a file', function (done) {
        priv.get("/export/contest_code/1000")
            .expect(200)
            .end(function(err, res) {
                expect(res.headers['content-type']).to.equal("application/file");
                done();
            });
    });

    it('should receive invalidParams', function (done) {
        priv.get("/export/contest_code/invalid")
            .expect(200)
            .end(function(err, res){
                expect(res.body).to.deep.equal(error.invalidParams);
                done();
            });
    });

    after(async function () {
        await removeAll();
    })
});