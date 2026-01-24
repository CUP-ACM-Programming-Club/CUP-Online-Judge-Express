const expect = require("chai").expect;
const util = require("../../../module/util");
const fakeDb = require("../../mocks/fake-db");

describe("util extra", function () {
	beforeEach(function () {
		fakeDb.reset();
	});

	it("should update newpassword via generateNewEncryptPassword", async function () {
		await fakeDb.query("insert into users (user_id,newpassword) values(?,?)", ["u1", "old"]);
		await util.generateNewEncryptPassword("u1", "pwd", "salt");
		const users = await fakeDb.query("select * from users where user_id = ?", ["u1"]);
		expect(users[0]).to.have.property("newpassword").that.is.a("string");
	});

	it("should remove contest data helpers", async function () {
		await fakeDb.query("insert into contest_problem (contest_id,problem_id,num) values(?,?,?)", [1, 100, 0]);
		await util.removeAllContestProblem(1);
		const rows = await fakeDb.query("select * from contest_problem where contest_id = ?", [1]);
		expect(rows).to.have.length(0);
	});

	it("should add contest problems", async function () {
		await util.addContestProblem(2, [100, 101]);
		const rows = await fakeDb.query("select * from contest_problem where contest_id = ?", [2]);
		expect(rows).to.have.length(2);
	});

	it("should add/remove contest problems with transaction", async function () {
		const connection = await fakeDb.transaction();
		await util.addContestProblemWithTransaction(connection, 5, [200]);
		let rows = await fakeDb.query("select * from contest_problem where contest_id = ?", [5]);
		expect(rows).to.have.length(1);
		await util.removeAllContestProblemWithTransaction(connection, 5);
		rows = await fakeDb.query("select * from contest_problem where contest_id = ?", [5]);
		expect(rows).to.have.length(0);
	});

	it("should add contest competitors", async function () {
		await util.addContestCompetitor(3, ["a", "b"]);
		const rows = await fakeDb.query("select * from privilege where rightstr = ?", ["c3"]);
		expect(rows).to.have.length(2);
	});

	it("should ignore empty competitor lists", async function () {
		await util.addContestCompetitor(7, []);
		const rows = await fakeDb.query("select * from privilege where rightstr = ?", ["c7"]);
		expect(rows).to.have.length(0);
		const connection = await fakeDb.transaction();
		await util.addContestCompetitorWithTransaction(connection, 8, []);
		const rows2 = await fakeDb.query("select * from privilege where rightstr = ?", ["c8"]);
		expect(rows2).to.have.length(0);
	});

	it("should add/remove contest competitors with transaction", async function () {
		const connection = await fakeDb.transaction();
		await util.addContestCompetitorWithTransaction(connection, 6, ["c"]);
		let rows = await fakeDb.query("select * from privilege where rightstr = ?", ["c6"]);
		expect(rows).to.have.length(1);
		await util.removeAllCompetitorPrivilegeWithTransaction(connection, 6);
		rows = await fakeDb.query("select * from privilege where rightstr = ?", ["c6"]);
		expect(rows).to.have.length(0);
	});

	it("should remove competitor privileges", async function () {
		await fakeDb.query("insert into privilege (user_id,rightstr) values(?,?)", ["a", "c4"]);
		await util.removeAllCompetitorPrivilege(4);
		const rows = await fakeDb.query("select * from privilege where rightstr = ?", ["c4"]);
		expect(rows).to.have.length(0);
	});

	it("should run startupInit update", async function () {
		await fakeDb.query("insert into solution (solution_id,result) values(?,?)", [1, 2]);
		await util.startupInit();
		const rows = await fakeDb.query("select * from solution where solution_id = ?", [1]);
		expect(rows[0].result).to.equal(1);
	});
});
