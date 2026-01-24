const expect = require("chai").expect;

describe("detect classroom", function () {
	const detectClassroom = require("../../module/detect_classroom");
	it('should return null while string does not contain dot', function () {
		expect(detectClassroom("1111")).to.equal(null);
	});
	it("should return null while ip is not in classroom", function () {
		expect(detectClassroom("127.0.0.1")).to.equal(null);
	});

	it("should return null if it's not an ip address", function () {
		expect(detectClassroom("10.200.c.d")).to.equal(null);
	});

	it("should return 403", function () {
		expect(detectClassroom("10.200.25.101")).to.equal(403);
	});

	it("should return null", function () {
		expect(detectClassroom("10.200.25.100")).to.equal(null);
	});

	it("should return 404", function () {
		expect(detectClassroom("10.200.26.100")).to.equal(404);
	});

	it("should return 405", function () {
		expect(detectClassroom("10.200.26.101")).to.equal(405);
	});

	it("should return 502", function () {
		expect(detectClassroom("10.200.28.80")).to.equal(502);
	});

	it("should return 503", function () {
		expect(detectClassroom("10.200.28.101")).to.equal(503);
	});

	it("should return 504", function () {
		expect(detectClassroom("10.200.27.10")).to.equal(504);
	});

	it("should return 1005", function () {
		expect(detectClassroom("10.200.32.10")).to.equal(1005);
	});

	it("should return 1006", function () {
		expect(detectClassroom("10.200.33.10")).to.equal(1006);
	});
});
