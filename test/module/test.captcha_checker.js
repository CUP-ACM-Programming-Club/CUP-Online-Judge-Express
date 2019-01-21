const expect = require("chai").expect;

describe("check captcha", function(){
	const checkCaptcha = require("../../module/captcha_checker");
	it("should require a object", function () {
		expect(checkCaptcha).to.have.property("checkCaptcha").that.is.a("function");
	});
});
