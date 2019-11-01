const expect = require("chai").expect;
const request = require("supertest");
const [error, ok] = require("../../module/const_var");

function afterAll() {
    require("../../module/mysql_cache").pool.end();
    require("../../module/mysql_query").pool.end();
    require("../../module/redis").quit();
}

describe("test login router", function(){
    let server;
    server = require("../../app");
    require("../../module/init/build_env")(true);
    require("../../module/init/express_loader")(server);
    const query = require("../../module/mysql_cache");
    before(function(){
        query("insert into users (user_id,password) values(?,?)",
            ["test", "ZNs/zvia7mVswcknwoXWOiuNwJUyMDg1"]);
    });

    it('should return status JSON', function (done) {
        request(server)
            .get("/login")
            .expect(200)
            .end(function(err,res){
                if(err){
                    done(err);
                }
                expect(res.body).to.have.ownProperty("status").that.is.equal("OK");
                expect(res.body).to.have.ownProperty("logined").that.is.a("boolean");
                done();
            })
    });

    it('should return invalidParams', function (done) {
        request(server)
            .post("/login")
            .send("t")
            .expect(200)
            .end(function(err, res){
                if(err) {
                    done(err);
                }
                expect(res.body).to.deep.equal(error.invalidParams);
                done();
            });
    });

    it('should return enter user_id', function (done) {
        request(server)
            .post("/login")
            .send({
                msg:""
            })
            .expect(200)
            .end(function(err,res){
                if(err) {
                    done(err);
                }
                expect(res.body).to.deep.equal(error.errorMaker("You should enter your user_id and password"));
                done();
            });
    });

    it('should return ok', function (done) {
        let data = {
            user_id:"test",
            password:"123456"
        };
        request(server)
            .post("/login")
            .send({
                msg:Buffer.from(Buffer.from(JSON.stringify(data)).toString("base64")).toString("base64")
            })
            .expect(200)
            .end(function(err,res){
                if(err){
                    done(err);
                }
                expect(res.body).to.deep.equal(ok.ok);
                done();
            });
    });

    /*it('should add newpassword return ok', function (done) {
        let data = {
            user_id:"test",
            pasword:"123456"
        };
        request(server)
            .post("/login/newpassword")
            .send(data)
            .expect(200)
            .end(function(err, res){
                if(err){
                    done(err);
                }
                expect(res.body).to.deep.equal(ok.ok);
                done();
            })
    });*/

    it('should return invalidJSON', function (done) {
        let data = "3f";
        request(server)
            .post("/login")
            .send({
                msg:Buffer.from(Buffer.from(data).toString("base64")).toString("base64")
            })
            .expect(200)
            .end(function(err,res){
                if(err){
                    done(err);
                }
                expect(res.body).to.deep.equal(error.invalidJSON);
                done();
            });
    });

    it('should return invalidUser', function (done) {
        let data = {
            user_id: "test",
            password: "1234567"
        };
        request(server)
            .post("/login")
            .send({
                msg:Buffer.from(Buffer.from(JSON.stringify(data)).toString("base64")).toString("base64")
            })
            .expect(200)
            .end(function(err,res){
                if(err) {
                    done(err);
                }
                expect(res.body).to.deep.equal(error.invalidUser);
                done();
            })
    });

    after(async function(){
        await query("delete from users where user_id = 'test'");
        afterAll();
    })
});
