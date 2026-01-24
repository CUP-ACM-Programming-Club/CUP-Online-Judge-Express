const expect = require("chai").expect;
const {error, ok} = require("../../../module/constants/state");

describe("state constants", function () {
	it("should build ok objects", function () {
		expect(ok.okMaker("x")).to.deep.equal({status: "OK", data: "x"});
		expect(ok.okFlatMaker({a: 1})).to.deep.equal({status: "OK", a: 1});
	});

	it("should build error objects", function () {
		expect(error.errorMaker("x")).to.deep.equal({status: "error", statement: "x"});
		expect(error.attributeMaker({code: 1})).to.have.property("code").that.equal(1);
	});
});
