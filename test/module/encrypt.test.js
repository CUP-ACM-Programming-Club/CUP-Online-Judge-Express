const expect = require("chai").expect;
describe("encrypt", function () {
	it("should encrypt and decrypt a text is equal", function () {
		const {encryptAES, decryptAES} = require("../../module/encrypt");
		const originalText = "test text";
		const key = "key";
		expect(decryptAES(encryptAES(originalText, key), key)).to.equal(originalText);
	});
});
