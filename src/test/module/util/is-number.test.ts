const expect = require("chai").expect;
const isNumber = require("../../../shared/isNumber").default || require("../../../shared/isNumber");

describe("isNumber", function () {
	it("should detect numbers and numeric strings", function () {
		expect(isNumber(3)).to.equal(true);
		expect(isNumber("4")).to.equal(true);
		expect(isNumber("  ")).to.equal(false);
		expect(isNumber("x")).to.equal(false);
	});
});
