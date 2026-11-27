import { expect } from "chai";
import sinon from "sinon";
import Module from "module";
import { bindPort, boundImpl } from "../../application/ports/registry";
import { submitContextRepository } from "../../application/ports/SubmitContextRepository";
import { submissionJudger } from "../../application/ports/SubmissionJudger";

describe("websocket SubmitHandler", function () {
    let handleSubmit: any;
    let previousLoad: any;
    let previousRepo: any;
    let previousJudger: any;
    let submitStub: sinon.SinonStub;
    let addJudgeRequest: sinon.SinonStub;
    let repo: any;
    let sendMessage: sinon.SinonStub;
    let sets: any;

    const freshSocket = () => {
        const emitted: any[] = [];
        return {
            emitted,
            user_id: "stu1",
            user_nick: "Stu",
            privilege: false,
            request: {},
            handshake: { headers: { cookie: "a=1" } },
            emit: (ev: string, payload: any) => emitted.push([ev, payload])
        } as any;
    };

    beforeEach(function () {
        submitStub = sinon.stub().resolves({ solution_id: 5001 });
        addJudgeRequest = sinon.stub().resolves(true);
        repo = {
            findUserAvatar: sinon.stub().resolves({ avatar: 1, avatarUrl: "u.png" }),
            findContestProblemId: sinon.stub().resolves(1234),
            findTopicProblemId: sinon.stub().resolves(4321),
            isProblemHidden: sinon.stub().resolves(false)
        };
        previousLoad = (Module as any)._load;
        (Module as any)._load = function (request: string) {
            if (request.endsWith("services/SubmissionService")) return { __esModule: true, default: { submit: submitStub } };
            if (request.endsWith("shared/Logger")) return { __esModule: true, default: { log: () => { } } };
            return previousLoad.apply(this, arguments);
        };
        Object.keys(require.cache).forEach(k => {
            if (k.includes("handlers/SubmitHandler")) delete require.cache[k];
        });
        handleSubmit = require("../../interfaces/websocket/handlers/SubmitHandler").handleSubmit;
        previousRepo = boundImpl(submitContextRepository);
        bindPort(submitContextRepository, repo);
        previousJudger = boundImpl(submissionJudger);
        bindPort(submissionJudger, { addTask: addJudgeRequest, getStatus: () => ({ free: 1 }) });
        const BroadcastManager = require("../../interfaces/websocket/managers/BroadcastManager").default;
        sendMessage = sinon.stub(BroadcastManager, "sendMessage");
        sets = {
            online: require("../../interfaces/websocket/set/OnlineUserSet").default,
            fromContest: require("../../interfaces/websocket/set/ProblemFromContest").default,
            fromTopic: require("../../interfaces/websocket/set/ProblemFromSpecialSubject").default,
            hidden: require("../../interfaces/websocket/set/HiddenProblemSubmission").default,
            origin: require("../../interfaces/websocket/set/SubmissionOriginSet").default,
            userInfo: require("../../interfaces/websocket/set/SubmitUserInfo").default
        };
        sets.online.set("stu1", { ip: "10.0.0.1", url: [] });
    });

    afterEach(function () {
        (Module as any)._load = previousLoad;
        if (previousRepo) bindPort(submitContextRepository, previousRepo);
        if (previousJudger) bindPort(submissionJudger, previousJudger);
        sinon.restore();
        for (const s of Object.values(sets) as any[]) {
            s.remove(5001);
        }
        sets.online.remove("stu1");
    });

    it("rejects when the submission is not created", async function () {
        submitStub.resolves({ status: "error", statement: "x" });
        const socket = freshSocket();
        await handleSubmit(socket, { val: { id: "1000" } });
        expect(socket.emitted).to.deep.equal([["reject_submit", { status: "error", statement: "x" }]]);
        expect(addJudgeRequest.called).to.equal(false);
    });

    it("problemset submission: pushes to status page for everyone and sends to judge", async function () {
        const socket = freshSocket();
        await handleSubmit(socket, { val: { id: "1000", fingerprint: "fp" } });
        expect(socket.emitted[0]).to.deep.equal(["judge:solution_id", { solution_id: 5001 }]);
        const statusPush = sendMessage.getCalls().find(c => c.args[1] === "submit");
        expect(statusPush!.args[3]).to.equal(1);
        expect(statusPush!.args[4]).to.equal(false);
        const data = statusPush!.args[2];
        expect(data.user_id).to.equal("stu1");
        expect(data.val.ip).to.equal("10.0.0.1");
        expect(data.val.avatarUrl).to.equal("u.png");
        expect(sets.userInfo.get(5001).avatar).to.equal(true);
        expect(repo.isProblemHidden.calledWith(1000)).to.equal(true);
        expect(sets.hidden.has(5001)).to.equal(false);
        expect(addJudgeRequest.calledWith(5001, false)).to.equal(true);
    });

    it("hidden problem: status page push is limited to privileged sockets", async function () {
        repo.isProblemHidden.resolves(true);
        await handleSubmit(freshSocket(), { val: { id: "6550" } });
        const statusPush = sendMessage.getCalls().find(c => c.args[1] === "submit");
        expect(statusPush!.args[4]).to.equal(true);
        expect(sets.hidden.get(5001)).to.equal(true);
    });

    it("contest submission: maps num to problem id and pushes to contest page", async function () {
        await handleSubmit(freshSocket(), { val: { cid: "1001", pid: 2 } });
        expect(repo.findContestProblemId.calledWith(1001, 2)).to.equal(true);
        expect(sets.fromContest.get(5001)).to.deep.equal({ contest_id: "1001", num: 2 });
        expect(sets.origin.get(5001)).to.equal(1001);
        const submits = sendMessage.getCalls().filter(c => c.args[1] === "submit");
        expect(submits).to.have.length(2);
        expect(submits[1].args[2].val.id).to.equal(1234);
        expect(submits[1].args[4]).to.equal(true);
        expect(repo.isProblemHidden.called).to.equal(false);
    });

    it("topic submission: maps num to problem id", async function () {
        await handleSubmit(freshSocket(), { val: { tid: "7", pid: 1 } });
        expect(repo.findTopicProblemId.calledWith(7, 1)).to.equal(true);
        const statusPush = sendMessage.getCalls().find(c => c.args[1] === "submit");
        expect(statusPush!.args[2].val.id).to.equal(4321);
    });

    it("tells the user when the judge queue rejects", async function () {
        addJudgeRequest.rejects(new Error("queue down"));
        const socket = freshSocket();
        await handleSubmit(socket, { val: { id: "1000" } });
        expect(socket.emitted[socket.emitted.length - 1]).to.deep.equal(["reject_submit", { solution_id: 5001 }]);
    });

    it("missing user row does not crash", async function () {
        repo.findUserAvatar.resolves(null);
        await handleSubmit(freshSocket(), { val: { id: "1000" } });
        expect(sets.userInfo.get(5001).avatar).to.equal(false);
        expect(addJudgeRequest.called).to.equal(true);
    });
});
