const expect = require("chai").expect;
const checkContest = require("../../../module/contest/check");
const {error} = require("../../../module/constants/state");
const fakeDb = require("../../mocks/fake-db");
const ContestAssistantManager = require("../../../manager/contest/ContestAssistantManager").default || require("../../../manager/contest/ContestAssistantManager");

describe("contest check", function () {
	beforeEach(function () {
		fakeDb.reset();
		global.contest_mode = false;
	});

	it("should reject invalid contest id", async function () {
		let response;
		const res = {json: data => { response = data; }};
		const result = await checkContest({session: {}}, res, 999);
		expect(result).to.equal(false);
		expect(response).to.deep.equal(error.invalidParams);
	});

	it("should allow admin", async function () {
		await fakeDb.query("insert into contest (contest_id, cmod_visible, start_time, end_time, private) values(?,?,?,?,?)",
			[1000, 1, "2000-01-01 00:00:00", "2100-01-01 00:00:00", 0]);
		const req = {session: {isadmin: true}};
		const result = await checkContest(req, {json() {}}, 1000);
		expect(result).to.be.an("array");
	});

	it("should block when contest mode hidden", async function () {
		global.contest_mode = true;
		await fakeDb.query("insert into contest (contest_id, cmod_visible, start_time, end_time, private) values(?,?,?,?,?)",
			[1000, 0, "2000-01-01 00:00:00", "2100-01-01 00:00:00", 0]);
		let response;
		const req = {session: {isadmin: false, contest_maker: {}, contest: {}, contest_manager: false}};
		const result = await checkContest(req, {json: data => { response = data; }}, 1000);
		expect(result).to.equal(false);
		expect(response).to.deep.equal(error.contestMode);
	});

	it("should block when contest mode disabled but visible only in contest mode", async function () {
		global.contest_mode = false;
		await fakeDb.query("insert into contest (contest_id, cmod_visible, start_time, end_time, private) values(?,?,?,?,?)",
			[1000, 1, "2000-01-01 00:00:00", "2100-01-01 00:00:00", 0]);
		let response;
		const req = {session: {isadmin: false, contest_maker: {}, contest: {}, contest_manager: false}};
		const result = await checkContest(req, {json: data => { response = data; }}, 1000);
		expect(result).to.equal(false);
		expect(response).to.deep.equal(error.contestMode);
	});

	it("should block when contest not started", async function () {
		await fakeDb.query("insert into contest (contest_id, cmod_visible, start_time, end_time, private) values(?,?,?,?,?)",
			[1000, 0, "2999-01-01 00:00:00", "2999-02-01 00:00:00", 0]);
		let response;
		const req = {session: {isadmin: false, contest_maker: {}, contest: {}, contest_manager: false}};
		const result = await checkContest(req, {json: data => { response = data; }}, 1000);
		expect(result).to.equal(false);
		expect(response).to.deep.equal(error.contestNotStart);
	});

	it("should deny private contest without privilege", async function () {
		await fakeDb.query("insert into contest (contest_id, cmod_visible, start_time, end_time, private) values(?,?,?,?,?)",
			[1000, 0, "2000-01-01 00:00:00", "2100-01-01 00:00:00", 1]);
		await fakeDb.query("insert into users (user_id,nick) values(?,?)", ["u1", "u1"]);
		let response;
		const req = {session: {isadmin: false, contest_maker: {}, contest: {}, contest_manager: false, user_id: "u1"}};
		const result = await checkContest(req, {json: data => { response = data; }}, 1000);
		expect(result).to.equal(false);
		expect(response).to.deep.equal(error.noprivilege);
	});

	it("should allow private contest with contest manager", async function () {
		await fakeDb.query("insert into contest (contest_id, cmod_visible, start_time, end_time, private) values(?,?,?,?,?)",
			[1000, 0, "2000-01-01 00:00:00", "2100-01-01 00:00:00", 1]);
		const req = {session: {isadmin: false, contest_maker: {}, contest: {}, contest_manager: true}};
		const result = await checkContest(req, {json() {}}, 1000);
		expect(result).to.be.an("array");
	});

	it("should allow private contest with assistant privilege", async function () {
		const original = ContestAssistantManager.userIsContestAssistant;
		ContestAssistantManager.userIsContestAssistant = async () => true;
		await fakeDb.query("insert into contest (contest_id, cmod_visible, start_time, end_time, private) values(?,?,?,?,?)",
			[1000, 0, "2000-01-01 00:00:00", "2100-01-01 00:00:00", 1]);
		const req = {session: {isadmin: false, contest_maker: {}, contest: {}, contest_manager: false, user_id: "u1"}};
		const result = await checkContest(req, {json() {}}, 1000);
		expect(result).to.be.an("array");
		ContestAssistantManager.userIsContestAssistant = original;
	});

	it("should allow public contest", async function () {
		await fakeDb.query("insert into contest (contest_id, cmod_visible, start_time, end_time, private) values(?,?,?,?,?)",
			[1000, 0, "2000-01-01 00:00:00", "2100-01-01 00:00:00", 0]);
		const req = {session: {isadmin: false, contest_maker: {}, contest: {}, contest_manager: false}};
		const result = await checkContest(req, {json() {}}, 1000);
		expect(result).to.be.an("array");
	});

	it("should allow private contest after login action", async function () {
		await fakeDb.query("insert into contest (contest_id, cmod_visible, start_time, end_time, private) values(?,?,?,?,?)",
			[1000, 0, "2000-01-01 00:00:00", "2100-01-01 00:00:00", 1]);
		await fakeDb.query("insert into users (user_id,nick) values(?,?)", ["u2", "u2"]);
		await fakeDb.query("insert into privilege (user_id,rightstr) values(?,?)", ["u2", "c1000"]);
		const req = {session: {isadmin: false, contest_maker: {}, contest: {}, contest_manager: false, user_id: "u2"}};
		const result = await checkContest(req, {json() {}}, 1000);
		expect(result).to.be.an("array");
	});
});
