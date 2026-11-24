import { definePort } from "./registry";

/**
 * 记录一次比赛作弊并按规则封禁（实现是 application/contest/cheating_ban 的用例，由 main/compose 绑定）。
 * 供 infrastructure 里的判题结果处理（BanUserManager）调用。
 */
export interface ContestCheatingRecorder {
	addCheating(userId: string, contest: number | string, payload: any): Promise<void>;
}

export const contestCheatingRecorder = definePort<ContestCheatingRecorder>("ContestCheatingRecorder");
