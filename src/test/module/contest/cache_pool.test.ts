const expect = require("chai").expect;
const contestCache = require("../../../module/contest/ContestCachePool");

describe("ContestCachePool", function () {
	it("should set and get cached value", async function () {
		await contestCache.set("key", {v: 1});
		const value = await contestCache.get("key");
		expect(value.data).to.deep.equal({v: 1});
	});
});
