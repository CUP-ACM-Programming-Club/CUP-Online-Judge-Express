import { definePort } from "./registry";

/**
 * 网页实时提交（websocket submit）时补全上下文用的查询：头像、比赛/专题题号换算、题目是否隐藏。
 * 原先这几条 SQL 直接写在 bin/main.ts 里。
 */
export interface SubmitContextRepository {
	/** users 表的 avatar / avatarUrl；用户不存在时返回 null */
	findUserAvatar(userId: string): Promise<{ avatar: any, avatarUrl: any } | null>;
	/** 比赛内题号（num）对应的真实 problem_id；找不到返回 null */
	findContestProblemId(contestId: number, num: any): Promise<number | null>;
	/** 专题内题号（num）对应的真实 problem_id；找不到返回 null */
	findTopicProblemId(topicId: number, num: any): Promise<number | null>;
	/** 题目是否为隐藏题（problem.defunct = 'Y'） */
	isProblemHidden(problemId: number): Promise<boolean>;
}

export const submitContextRepository = definePort<SubmitContextRepository>("SubmitContextRepository");
