const expect = require("chai").expect;
const ContestManager = require("../../../manager/contest/ContestManager").default || require("../../../manager/contest/ContestManager");
const PrivilegeManager = require("../../../manager/user/PrivilegeManager").default || require("../../../manager/user/PrivilegeManager");
const fakeDb = require("../../mocks/fake-db");

describe("ContestManager", function () {
	beforeEach(function () {
		fakeDb.reset();
		global.contest_mode = false;
	});

	it("should build sql strings", function () {
		const sql = ContestManager.buildSqlStructure("1=1", "1=1", null);
		const countSql = ContestManager.buildSqlCountStructure("1=1", "1=1", null);
		expect(sql).to.include("select");
		expect(countSql).to.include("count");
	});

	it("should compute limit and search sql", function () {
		const req = {query: {page: "2", search: "hello"}};
		const search = ContestManager.getSearchSql(req);
		expect(search.sqlArr[0]).to.equal("%hello%");
		expect(ContestManager.buildLimit(req)).to.equal(100);
	});

	it("should build my contest list", function () {
		const req = {
			query: {myContest: "1"},
			session: {
				contest_maker: {"m1000": true},
				contest: {"c1000": true}
			}
		};
		const list = ContestManager.getMyContestList(req);
		expect(list).to.include("contest_id in");
	});

	it("should return contest list and count", async function () {
		await fakeDb.query("insert into contest (contest_id,defunct,cmod_visible,title,start_time,end_time,private) values(?,?,?,?,?,?,?)",
			[1000, "N", 1, "t1", "2000-01-01 00:00:00", "2100-01-01 00:00:00", 0]);
		const req = {query: {}, session: {isadmin: true, contest_manager: false}};
		const result = await ContestManager.getContestList(req);
		const count = await ContestManager.getContestListCountByConditional("1=1", "1=1", {sql: null, sqlArr: []});
		expect(result).to.have.property("status").that.equal("OK");
		expect(result).to.have.property("data");
		expect(count).to.equal(0);
	});

	it("should count total number with subquery", async function () {
		const fakeDbModule = require("../../mocks/fake-db");
		fakeDbModule.registerHandler(
			(sql) => sql.toLowerCase().includes("from ("),
			() => [{cnt: 2}]
		);
		const count = await ContestManager.countTotalNumber("select * from contest");
		expect(count).to.equal(2);
		fakeDbModule.clearHandlers();
	});

	it("should manage contest competitors", async function () {
		await ContestManager.addContestCompetitor(1000, ["u1"]);
		let rows = await fakeDb.query("select * from privilege where rightstr = ?", ["c1000"]);
		expect(rows).to.have.length(1);
		await ContestManager.removeAllCompetitorFromPrivilege(1000);
		rows = await fakeDb.query("select * from privilege where rightstr = ?", ["c1000"]);
		expect(rows).to.have.length(0);
	});

	it("should update contest competitors", async function () {
		await ContestManager.updateContestCompetitor([1001], ["u2"], [1002]);
		const rows = await fakeDb.query("select * from privilege where rightstr = ?", ["c1002"]);
		expect(rows).to.have.length(1);
	});

	it("should check contest privilege", async function () {
		await fakeDb.query("insert into privilege (user_id,rightstr) values(?,?)", ["u3", "administrator"]);
		expect(await PrivilegeManager.isAdmin("u3")).to.equal(true);
		expect(await ContestManager.isContestSubmittable(1000, "u3")).to.equal(true);
	});

	it("should return contest list object and all list", async function () {
		await fakeDb.query("insert into contest (contest_id,defunct,cmod_visible,title,start_time,end_time,private) values(?,?,?,?,?,?,?)",
			[2000, "N", 0, "t2", "2000-01-01 00:00:00", "2100-01-01 00:00:00", 0]);
		const req = {query: {}, session: {isadmin: true, contest_manager: false, contest: {}, contest_maker: {}}};
		const listResult = await ContestManager.getContestListAsObjectByRequest(req);
		expect(listResult).to.have.property("status").that.equal("OK");
		const allResult = await ContestManager.getAllContestList();
		expect(allResult).to.have.property("status").that.equal("OK");
	});

	it("should handle empty competitor list and fetch competitors", async function () {
		const empty = await ContestManager.addContestCompetitor(3000, []);
		expect(empty).to.equal(undefined);
		await fakeDb.query("insert into privilege (user_id,rightstr) values(?,?)", ["u10", "c3000"]);
		const rows = await ContestManager.getContestCompetitorByContestId(3000);
		expect(rows).to.have.length(1);
	});

	it("should build privilege sql for contest mode", function () {
		global.contest_mode = true;
		const req = {session: {isadmin: false, contest_manager: false}};
		const sql = ContestManager.buildPrivilegeStr(req);
		expect(sql).to.include("cmod_visible");
		global.contest_mode = false;
	});
});
