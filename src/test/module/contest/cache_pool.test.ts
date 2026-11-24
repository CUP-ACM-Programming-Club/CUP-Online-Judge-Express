const expect = require("chai").expect;
const contestCache = require("../../../infrastructure/cache/pools/ContestCachePool");
const { contestCache: contestCachePort } = require("../../../application/ports/ContestCache");

describe("ContestCachePool", function () {
	it("should set and get cached value", async function () {
		await contestCache.set("key", {v: 1});
		const value = await contestCache.get("key");
		expect(value.data).to.deep.equal({v: 1});
	});

	it("application 经 ContestCache 端口拿到的是同一个缓存池", async function () {
		await contestCachePort.set("port-key", {v: 2});
		const value = await contestCache.get("port-key");
		expect(value.data).to.deep.equal({v: 2});
	});
});
