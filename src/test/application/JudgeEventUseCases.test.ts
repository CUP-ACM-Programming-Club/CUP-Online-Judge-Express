/**
 * 判题链路：判题机客户端 → JudgerEventListener 端口 → JudgeEventUseCases → JudgeResultNotifier 端口。
 * 端口都绑定内存假实现，只断言调用次序与参数（原 JudgeResultManager.messageHandle 的语义）。
 */
import { expect } from "chai";
import Module from "module";
import { bindTemporarily } from "../setup/rebind-port";
import { judgerEventListener, JudgerEventListener } from "../../application/ports/SubmissionJudger";
import { judgeResultNotifier, judgeStateLog, JudgeResultNotifier } from "../../application/ports/JudgeResultNotifier";
import { submissionBanUser } from "../../application/ports/SubmissionBanUser";
import { judgeResultRepository, JudgeResultRepository } from "../../application/ports/JudgeResultRepository";
import JudgeEventUseCases from "../../application/judging/JudgeEventUseCases";
import UnjudgedSubmissionCollector from "../../application/judging/UnjudgedSubmissionCollector";
import JudgeResultManager from "../../interfaces/websocket/managers/JudgeResultManager";
import SubmissionSet from "../../interfaces/websocket/set/SubmissionSet";
import SubmitUserInfo from "../../interfaces/websocket/set/SubmitUserInfo";

function recordingNotifier(calls: string[]): JudgeResultNotifier {
	return {
		attachSubmissionContext: (id, pack) => { calls.push(`attach:${id}`); pack.attached = true; },
		pushResult: (id, pack) => { calls.push(`push:${id}:${pack.attached}`); },
		clearBinding: id => { calls.push(`clear:${id}`); },
		notifyRemoteJudge: id => { calls.push(`remote:${id}`); }
	};
}

function recordingRepository(calls: string[]): JudgeResultRepository {
	const record = (name: string) => async (...args: any[]) => { calls.push(`${name}:${args[args.length - 1]}`); return []; };
	return {
		updateSolutionResult: record("updateSolutionResult"),
		findAdministratorPrivilege: async () => [],
		upsertSim: record("upsertSim"),
		deleteCompileInfo: record("deleteCompileInfo"),
		insertCompileInfo: record("insertCompileInfo"),
		deleteRuntimeInfo: record("deleteRuntimeInfo"),
		insertRuntimeInfo: record("insertRuntimeInfo"),
		getSolutionInfo: async () => ({ problem_id: 1000 }),
		findContestIdBySolution: async () => [],
		updateUserSolved: record("updateUserSolved"),
		updateUserSubmit: record("updateUserSubmit"),
		updateProblemAccepted: record("updateProblemAccepted"),
		updateProblemSubmit: record("updateProblemSubmit")
	};
}

describe("JudgeEventUseCases（判题结果处理）", function () {
	let calls: string[];
	let restores: (() => void)[];
	let logged: string[];

	beforeEach(function () {
		calls = [];
		logged = [];
		restores = [
			bindTemporarily(judgeResultNotifier, recordingNotifier(calls)),
			bindTemporarily(judgeResultRepository, recordingRepository(calls)),
			bindTemporarily(submissionBanUser, { banUser: async (pack: any) => { calls.push(`ban:${pack.solution_id}`); } }),
			bindTemporarily(judgeStateLog, { log: (message: string) => { logged.push(message); } })
		];
	});

	afterEach(function () {
		restores.reverse().forEach(restore => restore());
	});

	const pack = (state: number, finish: number) => ({
		solution_id: "77", finish: String(finish), state, user_id: "u", time: 1, memory: 2, pass_point: 1, pass_rate: 1,
		judger: "j", sim: 0, sim_s_id: 0, runtime_info: "", compile_info: "", test_run_result: ""
	});

	it("判题结束：合并上下文 → 封禁检查 → 回写结果 → 推送 → 清除登记", async function () {
		await JudgeEventUseCases.onJudgeResult(pack(4, 1));
		expect(calls[0]).to.equal("attach:77");
		expect(calls[1]).to.equal("ban:77");
		expect(calls[2]).to.equal("updateSolutionResult:77");
		expect(calls).to.include("updateUserSolved:u");
		expect(calls).to.include("updateProblemSubmit:1000");
		expect(calls.slice(-2)).to.deep.equal(["push:77:true", "clear:77"]);
	});

	it("判题进行中：只合并上下文并推送，不回写、不清除", async function () {
		await JudgeEventUseCases.onJudgeResult(pack(3, 0));
		expect(calls).to.deep.equal(["attach:77", "push:77:true"]);
	});

	it("state >= 32：只记日志，结束时清除登记", async function () {
		await JudgeEventUseCases.onJudgeResult(pack(32, 1));
		expect(logged).to.have.length(1);
		expect(logged[0]).to.match(/^got state error: /);
		expect(calls).to.deep.equal(["clear:77"]);
		calls.length = 0;
		await JudgeEventUseCases.onJudgeResult(pack(40, 0));
		expect(calls).to.deep.equal([]);
	});

	it("拒绝判题：记下无数据题目，通知提交者转远程判题", function () {
		JudgeEventUseCases.onRejectJudge({ reason: "no data", solutionId: 88, problemId: 4321 });
		expect(calls).to.deep.equal(["remote:88"]);
		expect((UnjudgedSubmissionCollector as any).noDataProblemIdSet.has("4321")).to.equal(true);
		(UnjudgedSubmissionCollector as any).noDataProblemIdSet.delete("4321");
	});
});

describe("JudgeResultManager（JudgeResultNotifier 的 WebSocket 实现）", function () {
	afterEach(function () {
		JudgeResultManager.clearBinding(91);
	});

	it("合并提交时登记的上下文，向提交者推送 result / remoteJudge，结束时清除", function () {
		const emitted: any[] = [];
		const socket: any = { emit: (event: string, payload: any) => emitted.push([event, payload]) };
		SubmissionSet.set(91, socket);
		SubmitUserInfo.set(91, { nick: "n", user_id: "u" });
		const solutionPack: any = { solution_id: 91 };
		JudgeResultManager.attachSubmissionContext(91, solutionPack);
		expect(solutionPack.nick).to.equal("n");
		JudgeResultManager.pushResult(91, solutionPack);
		JudgeResultManager.notifyRemoteJudge(91);
		expect(emitted).to.deep.equal([["result", solutionPack], ["remoteJudge", { solutionId: 91 }]]);
		JudgeResultManager.clearBinding(91);
		expect(SubmissionSet.has(91)).to.equal(false);
		expect(SubmitUserInfo.has(91)).to.equal(false);
	});
});

describe("localJudger 把判题机事件交给 JudgerEventListener 端口", function () {
	let previousLoad: any;
	let handlers: Record<string, (payload: any) => void>;
	let restore: () => void;
	let received: any[];
	const LOCAL_JUDGER = require.resolve("../../infrastructure/judger/localJudger");

	beforeEach(function () {
		handlers = {};
		received = [];
		previousLoad = (Module as any)._load;
		(Module as any)._load = function (request: string) {
			if (request === "socket.io-client") {
				return () => ({ connected: false, on: (event: string, handler: any) => { handlers[event] = handler; }, emit() { } });
			}
			return previousLoad.apply(this, arguments);
		};
		const listener: JudgerEventListener = {
			onJudgeResult: (payload: any) => { received.push(["result", payload]); },
			onRejectJudge: (info: any) => { received.push(["reject", info]); }
		};
		restore = bindTemporarily(judgerEventListener, listener);
		delete require.cache[LOCAL_JUDGER];
		require(LOCAL_JUDGER);
	});

	afterEach(function () {
		restore();
		(Module as any)._load = previousLoad;
		delete require.cache[LOCAL_JUDGER];
	});

	it("judger / reject_judge 事件原样转给端口", function () {
		handlers["judger"]({ solution_id: 1, state: 4 });
		handlers["reject_judge"]({ reason: "r", solutionId: 2, problemId: 3 });
		expect(received).to.deep.equal([["result", { solution_id: 1, state: 4 }], ["reject", { reason: "r", solutionId: 2, problemId: 3 }]]);
	});
});
