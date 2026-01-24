const expect = require("chai").expect;
const request = require("supertest");
const {error} = require("../../module/constants/state");

describe("test system router", function () {
    let server;
    server = require("../../app").default || require("../../app");
    require("../../module/init/build_env")(true);
    require("../../module/init/express_loader")(server);
    const query = require("../../module/mysql_cache");
    before(function (done) {
        query("insert into users (user_id,password) values(?,?)",
            ["test", "ZNs/zvia7mVswcknwoXWOiuNwJUyMDg1"])
            .then(el => {
                let data = {
                    user_id: "test",
                    password: "123456"
                };
                request(server)
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

    it('should return system status object', function (done) {
        request(server)
            .get("/system/stat/loadavg")
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    done(err);
                }
                expect(res.body).to.have.ownProperty("status")
                    .that.is.equal("OK");
                expect(res.body).to.have.ownProperty("data")
                    .that.is.not.deep.equal({});
                done();
            });
    });

    it("should handle loadavg error", function (done) {
        const os = require("os");
        const original = os.loadavg;
        os.loadavg = () => { throw new Error("fail"); };
        request(server)
            .get("/system/stat/loadavg")
            .expect(200)
            .end(function (err, res) {
                os.loadavg = original;
                if (err) {
                    done(err);
                }
                expect(res.body).to.deep.equal(error.internalError);
                done();
            });
    });

    after(async function () {
        await query("delete from users where user_id = 'test'");
    })
});
