const expect = require("chai").expect;
const query = require("../../module/mysql_cache");
global.unit_test = "autotest";

async function removeAll() {
    await query("delete from privilege where user_id = ?", ["test_name"]);
}

function afterAll() {
    require("../../module/mysql_cache").pool.end();
    require("../../module/mysql_query").pool.end();
    if(typeof require("../../module/redis").quit === "function") {
        require("../../module/redis").quit();
    }
}

describe("test auth", function () {
    const auth = require("../../middleware/auth");
    before(async function () {
        await removeAll();
        const query = require("../../module/mysql_query");
        await query("insert into privilege (user_id,rightstr)values(?,?)",
            ["test_name", "administrator"]);
        await query("insert into privilege (user_id,rightstr)values(?,?)",
            ["test_name", "m1000"]);
        await query("insert into privilege (user_id,rightstr)values(?,?)",
            ["test_name", "c1000"]);
        await query("insert into privilege (user_id,rightstr)values(?,?)",
            ["test_name", "p1000"]);
        await query("insert into privilege (user_id,rightstr)values(?,?)",
            ["test_name", "editor"]);
        await query("insert into privilege (user_id,rightstr)values(?,?)",
            ["test_name", "contest_manager"]);
        await query("insert into privilege (user_id,rightstr)values(?,?)",
            ["test_name", "source_browser"]);
    });


    it('should call login action', function (done) {
        let req =
            {
                session: {
                    auth: false,
                    isadmin: false,
                    user_id: ""
                },
                cookies: {
                    token:"test",
                    user_id: "test_name"
                }
            };
        let res = {
            json: function(data){

            },
            cookie: function() {}
        };
        auth(req, res, () => {
            expect(req.session.auth).to.equal(true);
            expect(req.session.isadmin).to.equal(true);
            expect(req.session.user_id).to.equal("test_name");
            done();
        });
    });

    it('should call res.json return nologin because of no user_id', function (done) {
        let req =
            {
                session: {
                    auth: false,
                    isadmin: false,
                    user_id: ""
                },
                cookies: {
                    token:"test",
                    user_id: undefined
                }
            };
        let res = {
            json: function(data){
                expect(data).to.have.ownProperty("status").that.equal("error");
                expect(data).to.have.ownProperty("statement").that.equal("not login");
                done();
            }
        };
        auth(req, res, () => {
            expect(req.session.auth).to.equal(true);
            expect(req.session.isadmin).to.equal(true);
            expect(req.session.user_id).to.equal("test_name");
            done();
        });
    });

    it('should call res.json return nologin because of not in redis array', function (done) {
        let req =
            {
                session: {
                    auth: false,
                    isadmin: false,
                    user_id: ""
                },
                cookies: {
                    token:"test1",
                    user_id: "test"
                }
            };
        let res = {
            json: function(data){
                expect(data).to.have.ownProperty("status").that.equal("error");
                expect(data).to.have.ownProperty("statement").that.equal("not login");
                done();
            }
        };
        auth(req, res, () => {
            expect(req.session.auth).to.equal(true);
            expect(req.session.isadmin).to.equal(true);
            expect(req.session.user_id).to.equal("test_name");
            done();
        });
    });


    after(async function () {
        await afterAll();
        await removeAll();
    })
});
