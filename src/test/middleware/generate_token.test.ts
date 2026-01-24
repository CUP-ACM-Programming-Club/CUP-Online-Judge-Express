const expect = require("chai").expect;
const generateToken = require("../../middleware/generate_token");

describe("generate_token", function () {
	it("should set cookies even without next", function () {
		const cookies = {};
		const req = {session: {user_id: "u1"}};
		const res = {
			cookie: function (key, value) {
				cookies[key] = value;
			}
		};
		generateToken(req, res);
		expect(cookies).to.have.property("newToken");
		expect(cookies).to.have.property("user_id").that.equal("u1");
	});
});
