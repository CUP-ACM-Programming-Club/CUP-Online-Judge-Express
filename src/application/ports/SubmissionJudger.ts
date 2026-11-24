import { definePort } from "./registry";

/**
 * 判题机端口：把提交交给判题机、查询判题机状态。
 * 实现：infrastructure/judger/localJudger（main/compose/submission 绑定）。
 */
export interface SubmissionJudger {
	addTask(solutionId: any, admin: boolean, noSim?: boolean, priority?: number): Promise<boolean>;
	getStatus(): any;
}

export const submissionJudger = definePort<SubmissionJudger>("SubmissionJudger");

export interface RejectJudgeInfo {
	reason: string,
	solutionId: number | string,
	problemId: number | string
}

/**
 * 判题机事件回调：判题机客户端收到判题结果 / 拒绝判题时交给 application 处理。
 * 实现：application/judging/JudgeEventUseCases（main/compose/submission 绑定）。
 * 判题机客户端在事件到达时才解析该端口，所以不依赖模块加载顺序。
 */
export interface JudgerEventListener {
	onJudgeResult(payload: any): Promise<void> | void;
	onRejectJudge(info: RejectJudgeInfo): void;
}

export const judgerEventListener = definePort<JudgerEventListener>("SubmissionJudgerEventListener");
