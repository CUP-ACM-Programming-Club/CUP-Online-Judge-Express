const expect = require("chai").expect;
const VersionManager = require("../../../infrastructure/persistence/system/VersionManager").default || require("../../../infrastructure/persistence/system/VersionManager");

describe("VersionManager", function () {
	it("should expose version info", function () {
		expect(VersionManager.version).to.be.a("string");
		expect(VersionManager.git).to.be.a("string");
		expect(VersionManager.license).to.be.a("string");
		expect(VersionManager.dependencies).to.be.an("object");
		expect(VersionManager.devDependencies).to.be.an("object");
	});
});
