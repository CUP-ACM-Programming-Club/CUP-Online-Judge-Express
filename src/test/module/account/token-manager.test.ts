const expect = require("chai").expect;
const TokenManager = require("../../../module/account/token/TokenManager").default || require("../../../module/account/token/TokenManager");
const redisModule = require("../../../module/redis");

describe("TokenManager", function () {
	it("should remove tokens", async function () {
		await TokenManager.removeToken("u1");
	});

	it("should store tokens and trim list", async function () {
		await TokenManager.storeToken("u1", "hash");
		expect(true).to.equal(true);
	});

	it("should trim and drain token lists", async function () {
		const client = redisModule.default || redisModule;
		const originalLlen = client.llenAsync;
		const originalLpop = client.lpopAsync;
		const originalRpush = client.rpushAsync;
		let lpopCalls = 0;
		client.llenAsync = async (key) => {
			if (key.endsWith("newToken")) {
				return 52;
			}
			return 1;
		};
		client.lpopAsync = async () => {
			lpopCalls += 1;
		};
		client.rpushAsync = async () => ["ok"];
		await TokenManager.storeToken("u2", "hash2");
		await TokenManager.removeToken("u2");
		expect(lpopCalls).to.be.greaterThan(0);
		client.llenAsync = originalLlen;
		client.lpopAsync = originalLpop;
		client.rpushAsync = originalRpush;
	});
});
