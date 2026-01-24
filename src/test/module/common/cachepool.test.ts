const expect = require("chai").expect;
const CachePool = require("../../../module/common/CachePool").default || require("../../../module/common/CachePool");

describe("CachePool", function () {
	it("should set and get values", async function () {
		const pool = new CachePool();
		await pool.set("k1", {v: 1});
		const value = await pool.get("k1");
		expect(value).to.have.property("data").that.deep.equal({v: 1});
	});

	it("should return null for missing keys", async function () {
		const pool = new CachePool();
		const value = await pool.get("missing");
		expect(value).to.equal(null);
	});

	it("should return all keys", async function () {
		const pool = new CachePool();
		await pool.set("k1", 1);
		await pool.set("k2", 2);
		const keys = pool.getAllKey();
		expect(keys).to.include("k1");
		expect(keys).to.include("k2");
	});

	it("should set with timestamp only when newer", async function () {
		const pool = new CachePool();
		const now = Date.now();
		await pool.setWithTimestamp("k1", 1, now);
		await pool.setWithTimestamp("k1", 2, now - 1000);
		let value = await pool.get("k1");
		expect(value.data).to.equal(1);
		await pool.setWithTimestamp("k1", 3, now + 1000);
		value = await pool.get("k1");
		expect(value.data).to.equal(3);
	});

	it("should recreate cache storage when missing", async function () {
		const pool = new CachePool();
		pool.__cache__ = null;
		const value = await pool.get("missing");
		expect(value).to.equal(null);
	});

	it("should remove and remove all", async function () {
		const pool = new CachePool();
		await pool.set("k1", 1);
		await pool.set("k2", 2);
		pool.remove("k1");
		let value = await pool.get("k1");
		expect(value).to.equal(null);
		pool.removeAll();
		expect(pool.getAllKey()).to.deep.equal([]);
	});
});
