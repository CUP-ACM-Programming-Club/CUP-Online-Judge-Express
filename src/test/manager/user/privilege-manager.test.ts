const expect = require("chai").expect;
const PrivilegeManager = require("../../../manager/user/PrivilegeManager").default || require("../../../manager/user/PrivilegeManager");
const fakeDb = require("../../mocks/fake-db");

describe("PrivilegeManager", function () {
	beforeEach(function () {
		fakeDb.reset();
	});

	it("should add and remove privileges", async function () {
		const added = await PrivilegeManager.addPrivilege("u1", "administrator");
		expect(added).to.equal(true);
		let rows = await fakeDb.query("select * from privilege where user_id = ?", ["u1"]);
		expect(rows).to.have.length(1);
		await PrivilegeManager.removePrivilege("u1", "administrator");
		rows = await fakeDb.query("select * from privilege where user_id = ?", ["u1"]);
		expect(rows).to.have.length(0);
	});

	it("should reject invalid privileges", async function () {
		const added = await PrivilegeManager.addPrivilege("u1", "invalid");
		expect(added).to.equal(false);
	});

	it("should check privileges", async function () {
		await fakeDb.query("insert into privilege (user_id,rightstr) values(?,?)", ["u2", "administrator"]);
		expect(await PrivilegeManager.isAdmin("u2")).to.equal(true);
		expect(await PrivilegeManager.isContestMaker("u2", 1000)).to.equal(0);
		await fakeDb.query("insert into privilege (user_id,rightstr) values(?,?)", ["u2", "m1000"]);
		expect(await PrivilegeManager.isContestMaker("u2", 1000)).to.equal(true);
	});
});
