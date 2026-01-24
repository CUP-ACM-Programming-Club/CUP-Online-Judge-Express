const expect = require("chai").expect;
const md5 = require("../../../module/util/md5").default || require("../../../module/util/md5");
const parameterHash = require("../../../module/util/parameterHash").default || require("../../../module/util/parameterHash");
const isNumber = require("../../../module/util/isNumber").default || require("../../../module/util/isNumber");

describe("util hash helpers", function () {
	it("should create md5 hash", function () {
		const hash = md5("abc");
		expect(hash).to.be.a("string");
	});

	it("should hash parameters by type", function () {
		expect(parameterHash("a")).to.equal("a");
		expect(parameterHash(12)).to.equal("12");
		expect(parameterHash(undefined)).to.equal("undefined");
		expect(parameterHash(null)).to.equal("null");
		expect(parameterHash({a: 1})).to.be.a("string");
	});

	it("should detect numbers", function () {
		expect(isNumber(12)).to.equal(true);
		expect(isNumber("12")).to.equal(true);
		expect(isNumber("  ")).to.equal(false);
		expect(isNumber("12a")).to.equal(false);
	});
});
