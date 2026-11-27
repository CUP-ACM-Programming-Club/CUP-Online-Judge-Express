/**
 * 网页实时提交（socket "submit" 事件）：落库 → 补全上下文 → 推给比赛页/状态页 → 送去判题。
 * 原先整段写在 bin/main.ts 的 io.on("connection") 里，行为保持不变。
 */
import { UserSocket } from "../Socket";
import SubmissionService from "../../../application/services/SubmissionService";
import { submitContextRepository } from "../../../application/ports/SubmitContextRepository";
import SolutionUserCollector from "../../../application/judging/SolutionUserCollector";
import { submissionJudger } from "../../../application/ports/SubmissionJudger";
import Logger from "../../../shared/Logger";
import OnlineUserSet from "../set/OnlineUserSet";
import AdminUserSet from "../set/AdminUserSet";
import SubmissionSet from "../set/SubmissionSet";
import SubmissionOriginSet from "../set/SubmissionOriginSet";
import SubmitUserInfo from "../set/SubmitUserInfo";
import SolutionContext from "../set/SolutionContext";
import ProblemFromContest from "../set/ProblemFromContest";
import ProblemFromSpecialSubject from "../set/ProblemFromSpecialSubject";
import HiddenProblemSubmission from "../set/HiddenProblemSubmission";
import ContestPagePushSet from "../set/ContestPagePushSet";
import StatusSet from "../singleton/StatusSet";
import BroadcastManager from "../managers/BroadcastManager";
const cookie = require("cookie");

/** 比赛/专题题号换算成真实题号，并记下提交来自哪场比赛/哪个专题 */
async function resolveProblemOrigin(data: any, submissionId: number) {
	const val = data.val;
	if (val && typeof val.cid !== "undefined" && !isNaN(parseInt(val.cid))) {
		const problemId = await submitContextRepository.findContestProblemId(Math.abs(val.cid), val.pid);
		if (problemId) {
			val.id = problemId;
			ProblemFromContest.set(submissionId, {
				contest_id: val.cid,
				num: val.pid
			});
		}
	} else if (val && typeof val.tid !== "undefined" && !isNaN(parseInt(val.tid))) {
		const problemId = await submitContextRepository.findTopicProblemId(Math.abs(val.tid), val.pid);
		if (problemId) {
			val.id = problemId;
			ProblemFromSpecialSubject.set(submissionId, {
				topic: val.topic_id,
				num: val.pid
			});
		}
	}
}

/** 实时推送：比赛提交推给比赛页和（有权限的）状态页；题库提交推给状态页，隐藏题只推给有权限的连接 */
async function broadcastSubmission(data: any, submissionId: number) {
	if (data.val && data.val.cid) {
		const contestId = Math.abs(parseInt(data.val.cid)) || 0;
		if (contestId >= 1000) {
			BroadcastManager.sendMessage(ContestPagePushSet.get(contestId), "submit", data, 1);
			BroadcastManager.sendMessage(StatusSet.getList(), "submit", data, 1, ProblemFromContest.has(submissionId));
			SubmissionOriginSet.set(submissionId, contestId);
		}
	} else {
		const problemId = data.val && parseInt(data.val.id);
		const hidden = problemId > 0 ? await submitContextRepository.isProblemHidden(problemId) : false;
		if (hidden) {
			HiddenProblemSubmission.set(submissionId, true);
		}
		BroadcastManager.sendMessage(StatusSet.getList(), "submit", data, 1, hidden);
	}
}

/**
 * _data 形如 { val: { id, input_text, language, source, type, cid?, pid?, tid?, fingerprint?, ... } }
 */
export async function handleSubmit(socket: UserSocket, _data: any) {
	const data = Object.assign({}, _data);
	let response: any;
	try {
		response = await SubmissionService.submit(socket.request, data.val, cookie.parse(socket.handshake.headers.cookie));
	} catch (e) {
		socket.emit("reject_submit", e);
		console.log(e);
		return;
	}
	if (!response.solution_id) {
		socket.emit("reject_submit", response);
		return;
	}
	socket.emit("judge:solution_id", response);
	data.submission_id = data.solution_id = response.solution_id;
	const ip = OnlineUserSet.get(socket.user_id!).ip;
	SolutionContext.set(data.submission_id, {
		ip,
		fingerprint: data.val.fingerprint,
		fingerprintRaw: data.val.fingerprintRaw
	});
	data.user_id = socket.user_id || "";
	data.nick = socket.user_nick;
	const submissionId = parseInt(data.submission_id);
	SubmissionSet.set(submissionId, socket);
	const avatar = await submitContextRepository.findUserAvatar(data.user_id);
	const avatarUrl = avatar ? avatar.avatarUrl : undefined;
	SubmitUserInfo.set(submissionId, {
		nick: data.nick,
		user_id: data.user_id,
		in_date: new Date().toISOString(),
		avatar: !!(avatar && avatar.avatar),
		avatarUrl
	});
	data.val.avatar = !!(avatar && avatar.avatar);
	data.val.avatarUrl = avatarUrl;
	await resolveProblemOrigin(data, submissionId);
	Object.assign(data.val, SolutionContext.get(submissionId));
	await broadcastSubmission(data, submissionId);
	SolutionUserCollector.set(data.submission_id, data);
	try {
		// 原 JudgeManager.addJudgeRequest 即 localJudger.addTask(id, superUser)
		const localEnvJudge = await submissionJudger.addTask(data.submission_id, socket.privilege!);
		if (!localEnvJudge) {
			socket.emit("remoteJudge", {
				solutionId: response.solution_id
			});
		}
		BroadcastManager.sendMessage(AdminUserSet.getInnerStorage(), "judger", submissionJudger.getStatus());
	} catch (err) {
		Logger.log("err info", err);
		socket.emit("reject_submit", response);
	}
}
