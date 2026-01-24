const expect = require("chai").expect;
const fs = require("fs");
const path = require("path");
const CompilerManager = require("../../../manager/judge/CompilerManager").default || require("../../../manager/judge/CompilerManager");

describe("CompilerManager", function () {
	const compilePath = path.join(__dirname, "..", "..", "fixtures", "compile.json");

	before(function () {
		fs.writeFileSync(compilePath, JSON.stringify({0: ["-O2"]}), "utf8");
		global.config.etc = global.config.etc || {};
		global.config.etc.compile_arguments = compilePath;
	});

	it("should read compile arguments", async function () {
		const result = await CompilerManager.getCompileArguments();
		expect(result).to.have.property("0");
	});

	it("should update compile arguments", async function () {
		await CompilerManager.updateCompileArguments({1: ["-O0"]});
		const result = await CompilerManager.getCompileArguments();
		expect(result).to.have.property("1");
	});

	it("should validate payload and return ok via request wrapper", async function () {
		const req = {body: {payload: {2: ["-g"]}}};
		const res = await CompilerManager.updateCompileArgumentsByRequest(req);
		expect(res).to.have.property("status").that.equal("OK");
	});

	it("should return error for invalid payload", async function () {
		const req = {body: {payload: {"bad": "value"}}};
		const res = await CompilerManager.updateCompileArgumentsByRequest(req);
		expect(res).to.have.property("status").that.equal("error");
	});

	it("should reject when compile file is missing", async function () {
		const original = global.config.etc.compile_arguments;
		global.config.etc.compile_arguments = path.join(__dirname, "..", "..", "fixtures", "missing.json");
		try {
			await CompilerManager.getCompileArguments();
			throw new Error("should throw");
		} catch (err) {
			expect(err).to.be.an("error");
		} finally {
			global.config.etc.compile_arguments = original;
		}
	});

	it("should reject when compile file cannot be written", async function () {
		const original = global.config.etc.compile_arguments;
		global.config.etc.compile_arguments = path.join(__dirname, "..", "..", "fixtures", "nope", "compile.json");
		try {
			await CompilerManager.updateCompileArguments({1: ["-O3"]});
			throw new Error("should throw");
		} catch (err) {
			expect(err).to.be.an("error");
		} finally {
			global.config.etc.compile_arguments = original;
		}
	});
});
