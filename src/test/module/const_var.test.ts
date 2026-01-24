const expect = require("chai").expect;
describe("const variable and function", function() {
	const [error, ok] = require("../../module/const_var");
	it("should return a array contain error and ok", function () {
		expect(error).to.be.a("object");
		expect(ok).to.be.a("object");
	});

	it("should construct a error object", function () {
		expect(error.errorMaker("test"))
			.to.have.property("statement")
			.that.equal("test");
		expect(error.attributeMaker({test:"statement"}))
			.to.have.property("test")
			.that.equal("statement");
	});

	it("should construct a ok object", function() {
		expect(ok.okMaker("test"))
			.to.have.property("data")
			.that.equal("test");
	})
});
