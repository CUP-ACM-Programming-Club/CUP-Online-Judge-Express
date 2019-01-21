const expect = require("chai").expect;
describe("admin", function() {
	const admin = require("../../middleware/admin");
	it("should go to next function", function (done) {
		const req = {session:{isadmin:true}};
		admin(req, {json: function(data){done(data)}}, done);
	});

	it("should return no privilege data", function () {
		const req = {session:{}};
		admin(req, {json: function(data){expect(data).to.have.property("status").that.equal("error")}})
	});
});
