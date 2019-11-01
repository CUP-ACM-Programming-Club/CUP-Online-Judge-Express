const expect = require("chai").expect;
const query = require("../../module/mysql_cache");
global.unit_test = "autotest";

async function removeAll() {
    await query("delete from privilege where user_id = ?", ["test_name"]);
    await query("delete from ban_user where user_id = ?", ["test_name"]);
    await query("delete from ban_user where user_id = ?", ["test1_name"]);
}

function afterAll() {
    require("../../module/mysql_cache").pool.end();
    require("../../module/mysql_query").pool.end();
    if (typeof require("../../module/redis").quit === "function") {
        require("../../module/redis").quit();
    }
}

describe("test ban_check", function () {
    const ban_check = require("../../middleware/ban_check");
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
        await query("insert into ban_user (user_id,bantime)values(?,?)", ["test_name", "2045-12-31"]);
        await query("insert into ban_user (user_id,bantime)values(?,?)", ["test1_name", "2005-12-31"]);
    });

    it('should return empty while next is not function', function (done) {
        ban_check({}, {});
        done();
    });

    it('should return nologin while not login', function (done) {
        ban_check({session: {auth: false, isadmin: false}}, {
            json: function (data) {
                expect(data).to.deep.equal(require("../../module/const_var")[0].nologin);
                done();
            }
        }, () => {
        });
    });

    it('should call next while user is admin', function (done) {
        ban_check({session: {auth: true, isadmin: true}}, {}, done);
    });

    it('should not banned', function (done) {
        ban_check({session: {auth: true, isadmin: false, user_id: "test"}}, {}, done);
    });

    it('should be banned', function (done) {
        ban_check({
            session: {
                auth: true, isadmin: false, user_id: "test_name", destroy: function () {
                    done();
                }
            }
        }, {
            json: function (data) {
                expect(data).to.deep.equal(require("../../module/const_var")[0].errorMaker("You have been banned"));
            }
        }, done);
    });

    it('was be banned but now expired', function (done) {
        ban_check({
            session: {
                auth: true, isadmin: false, user_id: "test1_name", destroy: function () {
                    done();
                }
            }
        }, {
            json: function (data) {
                expect(data).to.deep.equal(require("../../module/const_var")[0].errorMaker("You have been banned"));
            }
        }, done);
    });


    after(async function () {
        await afterAll();
        await removeAll();
    })
});
