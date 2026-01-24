const expect = require("chai").expect;

describe("check captcha", function(){
	const checkCaptcha = require("../../module/captcha_checker");
	it("should require a object", function () {
		expect(checkCaptcha).to.have.property("checkCaptcha").that.is.a("function");
	});

	it("should check captcha with same case", function () {
		const from = "test";
		const req = {
			session:{
				captcha:{
					from:"test",
					captcha: "captcha"
				}
			},
			body: {
				captcha: "captcha"
			}
		};
		expect(checkCaptcha.checkCaptcha(req, from))
			.to.be.a("boolean")
			.that.is.equal(true);
	});

	it("should return false if captcha from is different", function () {
		const from = "prod";
		const req = {
			session:{
				captcha:{
					from:"test",
					captcha: "captcha"
				}
			},
			body: {
				captcha: "captcha"
			}
		};
		expect(checkCaptcha.checkCaptcha(req, from))
			.to.be.a("boolean")
			.that.is.equal(false);
	});
	it("should return true with different case but same captcha", function () {
		const from = "test";
		const req = {
			session:{
				captcha:{
					from:"test",
					captcha: "CapTcHa"
				}
			},
			body: {
				captcha: "captcha"
			}
		};
		expect(checkCaptcha.checkCaptcha(req, from))
			.to.be.a("boolean")
			.that.is.equal(true);
	});
});
