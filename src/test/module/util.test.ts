const expect = require("chai").expect;
const util = require("../../module/util");

describe("util", function () {
	it("should reverse strings and non-strings", function () {
		expect(util.reverse("abc")).to.equal("cba");
		expect(util.reverse(12345)).to.equal("54321");
	});

	it("should validate JSON strings", function () {
		expect(util.checkJSON("{\"a\":1,\"b\":[true,false]}")).to.equal(true);
		expect(util.checkJSON("{a:1}")).to.equal(false);
	});

	it("should trim string properties and keep object reference", function () {
		const target = {name: "  alice  ", count: 3, note: "\tvalue\t"};
		const result = util.trimProperty(target);
		expect(result).to.equal(target);
		expect(target).to.deep.equal({name: "alice", count: 3, note: "value"});
	});

	it("should assert string inputs", function () {
		expect(util.assertString("ok")).to.equal(true);
		expect(() => util.assertString(12)).to.throw("variable should be a string");
	});

	it("should assert numeric inputs and parse ints", function () {
		expect(util.assertInt("42")).to.equal(42);
		expect(util.assertInt("12.7")).to.equal(12);
		expect(() => util.assertInt("12a")).to.throw("variable should be a number");
	});

	it("should roundtrip encryptPassword/decryptPassword", function () {
		const raw = "secret";
		const salt = "pepper";
		const encrypted = util.encryptPassword(raw, salt);
		expect(util.decryptPassword(encrypted, salt)).to.equal(raw);
	});
});
