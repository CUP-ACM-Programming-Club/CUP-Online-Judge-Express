const expect = require("chai").expect;
const {Interceptor} = require("../../module/interceptor/middleware");
const {error} = require("../../module/constants/state");

describe("Interceptor middleware", function () {
	it("should call res.json when validator fails", function () {
		const interceptor = new Interceptor();
		let payload;
		const middleware = interceptor.getInterceptorInstance();
		middleware({}, {json: data => { payload = data; }}, () => {});
		expect(payload).to.deep.equal(error.unavailable);
	});

	it("should call next when validator passes", function (done) {
		const interceptor = new Interceptor();
		interceptor.setValidator(() => true);
		const middleware = interceptor.getInterceptorInstance();
		middleware({}, {}, done);
	});

	it("should override error response", function () {
		const interceptor = new Interceptor();
		interceptor.setErrorResponse({rule: 10});
		let payload;
		const middleware = interceptor.getInterceptorInstance();
		middleware({}, {json: data => { payload = data; }}, () => {});
		expect(payload).to.have.property("rule").that.equal(10);
		expect(payload).to.have.property("status").that.equal("error");
	});
});
