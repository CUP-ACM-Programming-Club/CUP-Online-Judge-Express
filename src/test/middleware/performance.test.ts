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

	it("should include Cluster-Id when worker", function () {
		const cluster = require("cluster");
		const originalWorker = cluster.worker;
		const originalIsWorker = cluster.isWorker;
		cluster.isWorker = true;
		if (!cluster.isWorker) {
			try {
				Object.defineProperty(cluster, "isWorker", {value: true, configurable: true});
			} catch (err) {
				this.skip();
			}
		}
		cluster.worker = {id: 7};
		const performance = require("../../middleware/http_header");
		const localRes = {
			send() {},
			set(key, value) {
				this[key] = value;
			}
		};
		performance({}, localRes, () => {});
		localRes.send();
		expect(localRes["Cluster-Id"]).to.equal(7);
		cluster.worker = originalWorker;
		try {
			Object.defineProperty(cluster, "isWorker", {value: originalIsWorker, configurable: true});
		} catch (err) {
		}
	});
});
