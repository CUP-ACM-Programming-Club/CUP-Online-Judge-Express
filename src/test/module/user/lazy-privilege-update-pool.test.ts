const expect = require("chai").expect;
const pool = require("../../../application/user/LazyPrivilegeUpdatePool");

describe("LazyPrivilegeUpdatePool", function () {
	beforeEach(function () {
		pool.map = {};
	});

	it("should track update flags", function () {
		expect(pool.needUpdate("u1")).to.equal(undefined);
		pool.addToUpdate("u1");
		expect(pool.needUpdate("u1")).to.equal(true);
	});
});
