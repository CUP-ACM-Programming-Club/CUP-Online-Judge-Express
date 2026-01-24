const expect = require("chai").expect;

describe("check password", function(){
	const checkPassword = require("../../module/check_password");
	it("should return false when password doesn't match", function(){
		const {encryptPassword} = require("../../module/util");
		const salt = global.config.salt || "thisissalt";
		const original = Buffer.from("012345678901234567890123456789").toString("base64");
		const newpassword = encryptPassword("another", salt);
		expect(checkPassword(original, "wrong", newpassword)).to.be.a("boolean").that.is.equal(false);
	})
});
