const expect = require("chai").expect;

describe("login action test", function(){
    const login_action = require("../../module/login_action");

    it('should contained several object after login action', async function () {
        const req = {
            session: {}
        };
        await login_action(req, "test_name");
        expect(req.session.auth).to.equal(true);
        expect(req.session.user_id).to.equal("test_name");
        expect(req.session.contest).to.be.a("object").that.is.deep.equal({});
        expect(req.session.contest_maker).to.be.a("object").that.is.deep.equal({});
        expect(req.session.problem_maker).to.be.a("object").that.is.deep.equal({});
    });

    after(function(){
        require("../../module/mysql_query").pool.end();
    })
});