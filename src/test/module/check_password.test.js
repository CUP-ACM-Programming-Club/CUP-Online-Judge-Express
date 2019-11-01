const expect = require("chai").expect;

describe("check password", function(){
	const checkPassword = require("../../module/check_password");
	it("should return false when password doesn't match", function(){
		const value = "012345678901234567890123456789";
		expect(checkPassword(value, value.split("").reverse().join(""), value)).to.be.a("boolean").that.is.equal(false);
	})
});
