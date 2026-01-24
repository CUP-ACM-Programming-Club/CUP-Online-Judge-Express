const expect = require("chai").expect;
const path = require("path");

describe("router_loader", function () {
	it("should register routes twice and keep path when custom dir is provided", function () {
		const routerLoader = require("../../module/router_loader");
		const fixtureDir = path.join(__dirname, "..", "fixtures", "router_loader");
		const validRouter = require(path.join(fixtureDir, "valid.ts"));
		const calls = [];
		const app = {
			use: (...args) => calls.push(args)
		};

		routerLoader(app, fixtureDir);

		expect(calls).to.have.length(2);
		expect(calls[0][0]).to.equal("/foo");
		expect(calls[1][0]).to.equal("/foo");
		expect(calls[0][1]).to.equal(calls[1][1]);
		expect(validRouter[0]).to.equal("/foo");
	});

	it("should swallow router load errors", function () {
		const routerLoader = require("../../module/router_loader");
		const fixtureDir = path.join(__dirname, "..", "fixtures", "router_loader");
		const originalError = console.error;
		let errorCalls = 0;
		console.error = () => {
			errorCalls += 1;
		};
		const app = {
			use() {
				throw new Error("boom");
			}
		};
		routerLoader(app, fixtureDir);
		console.error = originalError;
		expect(errorCalls).to.be.greaterThan(0);
	});
});
