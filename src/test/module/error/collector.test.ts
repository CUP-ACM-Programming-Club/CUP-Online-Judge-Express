const expect = require("chai").expect;
const collector = require("../../../module/error/collector");

describe("ErrorCollector", function () {
	it("should store and return errors", function () {
		const file = "test-file";
		collector.push(file, new Error("boom"));
		const list = collector.getErrorByFileName(file);
		expect(list).to.have.length.greaterThan(0);
		expect(list[0]).to.have.property("content");
	});

	it("should return all errors map", function () {
		const map = collector.getAllError();
		expect(map).to.be.an("object");
	});

	it("should return empty list for unknown file", function () {
		const list = collector.getErrorByFileName("missing-file");
		expect(list).to.deep.equal([]);
	});
});
