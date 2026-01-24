const expect = require("chai").expect;
const isNumber = require("../../../module/util/isNumber").default || require("../../../module/util/isNumber");

describe("isNumber", function () {
	it("should detect numbers and numeric strings", function () {
		expect(isNumber(3)).to.equal(true);
		expect(isNumber("4")).to.equal(true);
		expect(isNumber("  ")).to.equal(false);
		expect(isNumber("x")).to.equal(false);
	});
});
