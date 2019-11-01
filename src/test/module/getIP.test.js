const expect = require("chai").expect;
const getIP = require("../../module/getIP");
describe("getIP", function(){
	it("should return IP address from x-forwarded-for", function () {
		const req = {
			headers:{
				"x-forwarded-for":"127.0.0.1"
			}
		};
		expect(getIP(req)).to.be.a("string")
			.that.is.equal("127.0.0.1");
	});

	it("should return IP address from connection remote address", function () {
		const req = {
			headers:{},
			connection: {
				remoteAddress: "127.0.0.1"
			}
		};
		expect(getIP(req)).to.be.a("string")
			.that.is.equal("127.0.0.1")
	});
});
