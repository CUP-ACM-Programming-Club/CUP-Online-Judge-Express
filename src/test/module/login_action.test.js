const expect = require("chai").expect;

describe("login action test", function () {
    const login_action = require("../../module/login_action");

    before(async function () {
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

    it('should contained several object after login action', async function () {
        const req = {
            session: {}
        };
        await login_action(req, "test_name");
        expect(req.session.auth).to.equal(true);
        expect(req.session.isadmin).to.equal(true);
        expect(req.session.editor).to.equal(true);
        expect(req.session.contest_manager).to.equal(true);
        expect(req.session.source_browser).to.equal(true);
        expect(req.session.user_id).to.equal("test_name");
        expect(req.session.contest).to.be.a("object").that.is.deep.equal({
            "c1000":true
        });
        expect(req.session.contest_maker).to.be.a("object").that.is.deep.equal({
            "m1000":true
        });
        expect(req.session.problem_maker).to.be.a("object").that.is.deep.equal({
            "p1000":true
        });
    });

    after(async function () {
        const query = require("../../module/mysql_query");
        await query("delete from privilege where user_id = ?", ["test_name"]);
        query.pool.end();
    })
});