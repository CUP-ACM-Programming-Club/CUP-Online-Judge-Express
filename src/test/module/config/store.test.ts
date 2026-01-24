const expect = require("chai").expect;
const mysqlFactory = require("../../../module/config/store/base/mysql").default || require("../../../module/config/store/base/mysql");
const redisFactory = require("../../../module/config/store/base/redis").default || require("../../../module/config/store/base/redis");
const loggerFactory = require("../../../module/config/log/base/logger-factory").default || require("../../../module/config/log/base/logger-factory");

describe("config store and logger", function () {
	it("should operate mysql store", async function () {
		const model = {
			upsert: () => Promise.resolve(),
			findOne: () => Promise.resolve({key: "k", value: "v"}),
			destroy: () => Promise.resolve(1),
			findAll: () => Promise.resolve([{key: "k"}])
		};
		const Store = mysqlFactory(model);
		const store = new Store();
		await store.set({key: "k", value: "v"});
		expect(await store.get("k")).to.have.property("key");
		expect(await store.getAll()).to.have.length(1);
		expect(await store.remove("k")).to.equal(1);
	});

	it("should operate redis store", async function () {
		const Store = redisFactory("config");
		const store = new Store();
		await store.set({key: "k", value: "v"});
		await store.get("k");
		await store.getAll();
		await store.remove("k");
	});

	it("should log and restore with logger factory", async function () {
		const model = {
			create: () => Promise.resolve(),
			findByPk: () => Promise.resolve({
				get: () => ({operation: "SET", key: "x", value: "1", comment: "c"})
			})
		};
		let removed = false;
		const logger = loggerFactory(model)({
			set: function (key, value) { this.__set__ = {key, value}; },
			remove: function () { removed = true; }
		});
		logger.setManager({});
		await logger.log("SET", {key: "x", value: "1", comment: "c"});
		await logger.restore(1);
		expect(removed).to.equal(false);
	});

	it("should restore delete operation and ignore missing logs", async function () {
		let removed = false;
		const operations = require("../../../module/config/constants/operation");
		const deleteLogger = loggerFactory({
			create: () => Promise.resolve(),
			findByPk: () => Promise.resolve({
				get: () => ({operation: operations.DELETE, key: "x", value: "1", comment: "c"})
			})
		})({
			set: function () {},
			remove: function () { removed = true; }
		});
		await deleteLogger.restore(1);
		expect(removed).to.equal(true);

		const emptyLogger = loggerFactory({
			create: () => Promise.resolve(),
			findByPk: () => Promise.resolve(null)
		})({
			set: function () {},
			remove: function () {}
		});
		await emptyLogger.restore(1);
	});
});
