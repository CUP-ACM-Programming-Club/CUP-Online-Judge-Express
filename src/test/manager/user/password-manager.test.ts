const expect = require("chai").expect;
const PasswordManager = require("../../../application/auth/PasswordManager").default || require("../../../application/auth/PasswordManager");
const util = require("../../../application/util");
const crypto = require("crypto");

describe("PasswordManager", function () {
	it("should validate password with newpassword", function () {
		const raw = "secret";
		const salt = global.config.salt || "testsalt";
		const newpassword = util.encryptPassword(raw, salt);
		const result = PasswordManager.checkPassword("invalid", raw, newpassword);
		expect(result).to.equal(true);
	});

	it("newpassword 为空（老账号）时不会抛异常：多次校验都只返回 true/false", function () {
		// crypto-js 解密非法密文会用随机盐，偶尔抛 Malformed UTF-8；以前这会让登录请求挂起
		for (let i = 0; i < 500; i++) {
			expect(PasswordManager.checkPassword("invalid", "123456", null)).to.equal(false);
		}
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
