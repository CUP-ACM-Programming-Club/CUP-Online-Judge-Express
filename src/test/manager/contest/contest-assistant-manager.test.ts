const expect = require("chai").expect;
const ContestAssistantManager = require("../../../manager/contest/ContestAssistantManager").default || require("../../../manager/contest/ContestAssistantManager");
const fakeDb = require("../../mocks/fake-db");

describe("ContestAssistantManager", function () {
	beforeEach(function () {
		fakeDb.reset();
	});

	it("should set and remove contest assistants", async function () {
		await ContestAssistantManager.setContestAssistant(1000, "u1");
		let rows = await fakeDb.query("select * from contest_assistant where contest_id = ?", [1000]);
		expect(rows).to.have.length(1);
		await ContestAssistantManager.removeContestAssistant(1000, "u1");
		rows = await fakeDb.query("select * from contest_assistant where contest_id = ?", [1000]);
		expect(rows).to.have.length(0);
	});

	it("should get assistants by request", async function () {
		await fakeDb.query("insert into contest_assistant (contest_id, user_id) values(?,?)", [1000, "u2"]);
		const req = {params: {contestId: 1000}};
		const result = await ContestAssistantManager.getContestAssistantsByRequest(req);
		expect(result).to.have.property("status").that.equal("OK");
	});

	it("should manage topic assistants list", async function () {
		await ContestAssistantManager.setContestAssistantByTopicId(200, "u3");
		await ContestAssistantManager.updateTopicAssistantListByRequest({
			body: {topicAssistant: ["u4", "u5"], contestSetId: 200}
		});
		const rows = await fakeDb.query("select * from topic_assistant where topic_id = ?", [200]);
		expect(rows).to.have.length(2);
	});

	it("should check assistant privilege", async function () {
		await fakeDb.query("insert into contest_assistant (contest_id, user_id) values(?,?)", [1000, "u6"]);
		const isAssistant = await ContestAssistantManager.userIsContestAssistant(1000, "u6");
		expect(isAssistant).to.equal(true);
	});

	it("should handle request wrappers", async function () {
		await fakeDb.query("insert into contest_assistant (contest_id, user_id) values(?,?)", [1000, "u7"]);
		const list = await ContestAssistantManager.getAllContestAssistantsByRequest({});
		expect(list).to.have.property("status").that.equal("OK");

		const isAssistant = await ContestAssistantManager.userIsContestAssistantByRequest({
			params: {contest_id: 1000},
			session: {user_id: "u7"}
		});
		expect(isAssistant).to.have.property("status").that.equal("OK");

		const setRes = await ContestAssistantManager.setContestAssistantByRequest({
			body: {contestId: 1001, userId: "u8"}
		});
		expect(setRes).to.have.property("status").that.equal("OK");

		const topicRes = await ContestAssistantManager.setContestAssistantByTopicByRequest({
			params: {topicId: 200},
			body: {userId: "u9"}
		});
		expect(topicRes).to.have.property("status").that.equal("OK");

		const removeRes = await ContestAssistantManager.removeContestAssistantByRequest({
			body: {contestId: 1001, userId: "u8"}
		});
		expect(removeRes).to.have.property("status").that.equal("OK");
	});
});
