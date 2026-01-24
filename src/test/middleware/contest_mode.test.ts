const expect = require("chai").expect;
describe("contest mode", function() {
	const contest_mode = require("../../middleware/contest_mode");
	it("should return next if user is admin", async function () {
		const req = {
			session:{
				isadmin: true
			}
		};
		const next = function () {};
		const result = await contest_mode(req, {}, next);
		expect(result).to.equal(next);
	});
	it("should set contest mode when user is not admin", async function () {
		const req = {
			session:{
				isadmin: false
			}
		};

		const next = function () {};
		const result = await contest_mode(req, {}, next);
		expect(global.contest_mode).to.not.be.a("undefined");
		expect(result).to.equal(next);
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
