import { definePort } from "./registry";

/**
 * 判题结果通知端口：把判题结果推送给提交者、状态页、比赛页。
 * 提交时登记的上下文（提交者信息、比赛/专题来源、IP 指纹）也由推送侧保存，所以合并上下文也走这里。
 * 实现：interfaces/websocket/managers/JudgeResultManager（main/compose/submission 绑定）。
 */
export interface JudgeResultNotifier {
	/** 把提交时登记的上下文合并进判题结果（原地修改 solutionPack） */
	attachSubmissionContext(solutionId: number, solutionPack: any): void;
	/** 推送判题结果 */
	pushResult(solutionId: number, solutionPack: any): void;
	/** 判题结束，清除该提交登记的上下文 */
	clearBinding(solutionId: number): void;
	/** 本地判题机拒绝判题（无数据），通知提交者转远程判题 */
	notifyRemoteJudge(solutionId: number | string): void;
}

export const judgeResultNotifier = definePort<JudgeResultNotifier>("SubmissionJudgeResultNotifier");

/** 判题异常状态日志（state >= 32）。实现：infrastructure/logging/log4j。 */
export interface JudgeStateLog {
	log(message: string): void;
}

export const judgeStateLog = definePort<JudgeStateLog>("SubmissionJudgeStateLog");
