const expect = require("chai").expect;
const CachePool = require("../../shared/cache/CachePool").default || require("../../shared/cache/CachePool");
const Cacheable = require("../../shared/cache/Cacheable").default || require("../../shared/cache/Cacheable");
const Lock = require("../../shared/decorators/Lock").default || require("../../shared/decorators/Lock");
const Timer = require("../../shared/decorators/Timer").default || require("../../shared/decorators/Timer");
const ResponseLogger = require("../../shared/decorators/ResponseLogger").default || require("../../shared/decorators/ResponseLogger");
const {ErrorHandlerFactory} = require("../../shared/decorators/ErrorHandler");

describe("decorators", function () {
	it("Lock should acquire and release around method", async function () {
		const calls = [];
		const fakeLock = {
			async getLock(key) {
				calls.push(["get", key]);
			},
			release(key) {
				calls.push(["release", key]);
			}
		};
		class Demo {
			value() {
				return "ok";
			}
		}
		const descriptor = Object.getOwnPropertyDescriptor(Demo.prototype, "value");
		Lock(fakeLock)(Demo.prototype, "value", descriptor);
		Object.defineProperty(Demo.prototype, "value", descriptor);
		const demo = new Demo();
		expect(await demo.value("k")).to.equal("ok");
		expect(calls).to.deep.equal([["get", "k"], ["release", "k"]]);
	});

	it("Cacheable should cache responses and return cached data", async function () {
		const pool = new CachePool();
		class Demo {
			count = 0;
			async value(input) {
				this.count += 1;
				return `${input}:${this.count}`;
			}
		}
		const descriptor = Object.getOwnPropertyDescriptor(Demo.prototype, "value");
		Cacheable(pool, 10, "minute")(Demo.prototype, "value", descriptor);
		Object.defineProperty(Demo.prototype, "value", descriptor);
		const demo = new Demo();
		const first = await demo.value("a");
		const second = await demo.value("a");
		expect(first).to.equal("a:1");
		expect(second).to.equal("a:1");
	});

	it("Cacheable should ignore cache when no args", async function () {
		const pool = new CachePool();
		class Demo {
			count = 0;
			async value() {
				this.count += 1;
				return this.count;
			}
		}
		const descriptor = Object.getOwnPropertyDescriptor(Demo.prototype, "value");
		Cacheable(pool, 10, "minute")(Demo.prototype, "value", descriptor);
		Object.defineProperty(Demo.prototype, "value", descriptor);
		const demo = new Demo();
		const first = await demo.value();
		const second = await demo.value();
		expect(first).to.equal(1);
		expect(second).to.equal(1);
	});

	it("Cacheable should handle set failure", async function () {
		const pool = new CachePool();
		pool.set = async () => {
			throw new Error("set failed");
		};
		class Demo {
			async value() {
				return "ok";
			}
		}
		const descriptor = Object.getOwnPropertyDescriptor(Demo.prototype, "value");
		Cacheable(pool, 10, "minute")(Demo.prototype, "value", descriptor);
		Object.defineProperty(Demo.prototype, "value", descriptor);
		const demo = new Demo();
		const result = await demo.value("x");
		expect(result).to.equal(null);
	});

	it("Cacheable should return undefined responses", async function () {
		const pool = new CachePool();
		class Demo {
			async value() {
				return undefined;
			}
		}
		const descriptor = Object.getOwnPropertyDescriptor(Demo.prototype, "value");
		Cacheable(pool, 10, "minute")(Demo.prototype, "value", descriptor);
		Object.defineProperty(Demo.prototype, "value", descriptor);
		const demo = new Demo();
		const result = await demo.value("x");
		expect(result).to.equal(undefined);
	});

	it("Timer should wrap sync and async methods and close spans", async function () {
		let finished = false;
		const tracer = {
			startSpan() {
				return {
					finish() {
						finished = true;
					}
				};
			}
		};
		class Demo {
			sync(req) {
				return req.flag;
			}
			async async(req) {
				return req.flag;
			}
		}
		let descriptor = Object.getOwnPropertyDescriptor(Demo.prototype, "sync");
		Timer(Demo.prototype, "sync", descriptor);
		Object.defineProperty(Demo.prototype, "sync", descriptor);
		descriptor = Object.getOwnPropertyDescriptor(Demo.prototype, "async");
		Timer(Demo.prototype, "async", descriptor);
		Object.defineProperty(Demo.prototype, "async", descriptor);
		const demo = new Demo();
		expect(demo.sync({flag: true, tracer, parentSpan: {}})).to.equal(true);
		expect(await demo.async({flag: true, tracer, parentSpan: {}})).to.equal(true);
		expect(finished).to.equal(true);
	});

	it("ResponseLogger should pass through response", function () {
		class Demo {
			value(a, b) {
				return a + b;
			}
		}
		const descriptor = Object.getOwnPropertyDescriptor(Demo.prototype, "value");
		ResponseLogger(Demo.prototype, "value", descriptor);
		Object.defineProperty(Demo.prototype, "value", descriptor);
		const demo = new Demo();
		expect(demo.value(1, 2)).to.equal(3);
	});

	it("ErrorHandlerFactory should wrap sync and async errors", async function () {
		const wrapper = (data) => ({wrapped: data});
		class Demo {
			syncFail() {
				throw new Error("sync");
			}
			async asyncFail() {
				throw new Error("async");
			}
		}
		let descriptor = Object.getOwnPropertyDescriptor(Demo.prototype, "syncFail");
		ErrorHandlerFactory(wrapper)(Demo.prototype, "syncFail", descriptor);
		Object.defineProperty(Demo.prototype, "syncFail", descriptor);
		descriptor = Object.getOwnPropertyDescriptor(Demo.prototype, "asyncFail");
		ErrorHandlerFactory(wrapper)(Demo.prototype, "asyncFail", descriptor);
		Object.defineProperty(Demo.prototype, "asyncFail", descriptor);
		const demo = new Demo();
		const syncResult = demo.syncFail();
		expect(syncResult).to.have.property("status").that.equal("error");
		const asyncResult = await demo.asyncFail();
		expect(asyncResult).to.have.property("status").that.equal("error");
	});

	it("ErrorHandlerFactory should handle non-error throws", function () {
		class Demo {
			fail() {
				throw "plain";
			}
		}
		const descriptor = Object.getOwnPropertyDescriptor(Demo.prototype, "fail");
		ErrorHandlerFactory(data => data)(Demo.prototype, "fail", descriptor);
		Object.defineProperty(Demo.prototype, "fail", descriptor);
		const demo = new Demo();
		const result = demo.fail();
		expect(result).to.have.property("status").that.equal("error");
	});

	it("ErrorHandlerFactory should wrap successful results", async function () {
		const wrapper = (data) => ({wrapped: data});
		class Demo {
			syncOk() {
				return 7;
			}
			async asyncOk() {
				return 9;
			}
		}
		let descriptor = Object.getOwnPropertyDescriptor(Demo.prototype, "syncOk");
		ErrorHandlerFactory(wrapper)(Demo.prototype, "syncOk", descriptor);
		Object.defineProperty(Demo.prototype, "syncOk", descriptor);
		descriptor = Object.getOwnPropertyDescriptor(Demo.prototype, "asyncOk");
		ErrorHandlerFactory(wrapper)(Demo.prototype, "asyncOk", descriptor);
		Object.defineProperty(Demo.prototype, "asyncOk", descriptor);
		const demo = new Demo();
		expect(demo.syncOk()).to.deep.equal({wrapped: 7});
		expect(await demo.asyncOk()).to.deep.equal({wrapped: 9});
	});
});
