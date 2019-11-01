const expect = require("chai").expect;
describe("contest mode", function() {
	const contest_mode = require("../../middleware/contest_mode");
	it("should execute next if user is admin", function (done) {
		const req = {
			session:{
				isadmin: true
			}
		};
		contest_mode(req, {}, done);
	});
	it("should execute next if user is not admin", function (done) {
		const req = {
			session:{
				isadmin: false
			}
		};

		contest_mode(req, {}, () => {
			expect(global.contest_mode).to.not.be.a("undefined");
			done();
		})
	});
	beforeEach(function(){
		global.contest_mode = undefined;
	});
	afterEach(function(){
		global.contest_mode = undefined;
	});
	after(function(){
		require("../../module/mysql_cache").pool.end();
	})
});
