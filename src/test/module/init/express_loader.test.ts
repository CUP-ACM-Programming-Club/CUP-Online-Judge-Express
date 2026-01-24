const expect = require("chai").expect;
const loader = require("../../../module/init/express_loader");

describe("express_loader", function () {
	it("should register middleware and handle not found/error", function () {
		const handlers = [];
		const app = {
			use(fn) {
				handlers.push(fn);
			}
		};
		loader(app, {});
		// Find 404 handler (2 args) and error handler (4 args)
		// Filter out non-function handlers (e.g. strings from app.use(path, router))
		const functionHandlers = handlers.filter(h => typeof h === "function");
		const notFound = functionHandlers.find(h => h.length === 2 && !h.name.includes("serveStatic"));
		// Actually notFound is declared as (req, res). length === 2.
		// Error handler is (err, req, res, next). length === 4.
		const errorHandler = functionHandlers.find(h => h.length === 4);
		let jsonPayload;
		const res = {
			json(data) {
				jsonPayload = data;
			},
			status(code) {
				this.statusCode = code;
				return this;
			}
		};
		notFound({ originalUrl: "/missing" }, res);
		expect(jsonPayload).to.have.property("status").that.equal("error");
		let errorPayload;
		errorHandler({ statusCode: 400 }, {}, {
			status(code) {
				this.statusCode = code;
				return this;
			},
			json(data) {
				errorPayload = data;
			}
		}, () => { });
		expect(errorPayload).to.have.property("statement");
	});
});
