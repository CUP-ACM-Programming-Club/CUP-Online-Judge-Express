const expect = require("chai").expect;
const PasswordManager = require("../../../manager/user/PasswordManager").default || require("../../../manager/user/PasswordManager");
const util = require("../../../module/util");
const crypto = require("crypto");

describe("PasswordManager", function () {
	it("should validate password with newpassword", function () {
		const raw = "secret";
		const salt = global.config.salt || "testsalt";
		const newpassword = util.encryptPassword(raw, salt);
		const result = PasswordManager.checkPassword("invalid", raw, newpassword);
		expect(result).to.equal(true);
	});

	it("should generate random password", function () {
		const result = PasswordManager.generateRandomPassword(10);
		expect(result).to.have.length(10);
	});

	it("should fallback when crypto fails", function () {
		const original = crypto.randomBytes;
		crypto.randomBytes = () => { throw new Error("fail"); };
		const result = PasswordManager.generateRandomPassword(9);
		crypto.randomBytes = original;
		expect(result).to.be.a("string");
	});

	it("should return empty when length is not positive", function () {
		expect(PasswordManager.generateRandomPassword(0)).to.equal("");
		expect(PasswordManager.generateRandomPassword(-1)).to.equal("");
	});
});
