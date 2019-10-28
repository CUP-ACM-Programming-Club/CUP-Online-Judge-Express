const expect = require("chai").expect;
const res = {};
res.send = function(){}
res.set = function(key, value) {
	this[key] = value;
};
describe("performance middleware", function(){
	it("should contain a header X-Execution-Time", function () {
		const performance = require("../../middleware/http_header");
		performance({}, res, ()=>{});
		res.send();
		expect(res["X-Execution-Time"]).to.be.a("string");
		expect(isNaN(res["X-Execution-Time"])).to.equal(false);
	});
});
