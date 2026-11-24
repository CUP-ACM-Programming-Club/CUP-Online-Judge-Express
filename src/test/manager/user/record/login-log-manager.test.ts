const expect = require("chai").expect;
const LoginLogManager = require("../../../../infrastructure/persistence/user/record/LoginLogManager").default || require("../../../../infrastructure/persistence/user/record/LoginLogManager");
const LoginLogController = require("../../../../interfaces/http/controllers/LoginLogController").default;
const fakeDb = require("../../../mocks/fake-db");

describe("LoginLogManager", function () {
	beforeEach(function () {
		fakeDb.reset();
	});

	it("should insert login log", async function () {
		await LoginLogManager.setUserIdLoginLog("u1", {
			browser_name: "Chrome",
			browser_version: "1",
			os_name: "Windows",
			os_version: "10"
		}, "127.0.0.1");
		const rows = await fakeDb.query("select * from loginlog where user_id = ?", ["u1"]);
		expect(rows).to.have.length(1);
	});

	it("should return logs by request", async function () {
		const req = {params: {userId: "u1"}, query: {page: "0"}};
		const result = await LoginLogController.getUserLoginLog(req);
		expect(result).to.have.property("status").that.equal("OK");
	});

	it("should return latest logs by request", async function () {
		const req = {};
		const result = await LoginLogController.getLatestLoginLog(req);
		expect(result).to.have.property("status").that.equal("OK");
	});

	it("should set login log by request", async function () {
		const req = {
			session: {user_id: "u2"},
			body: {
				browser_name: "Edge",
				browser_version: "2",
				os_name: "Linux",
				os_version: "1"
			},
			clientIp: "10.0.0.1"
		};
		const result = await LoginLogController.setUserIdLoginLog(req);
		expect(result).to.have.property("status").that.equal("OK");
	});
});
