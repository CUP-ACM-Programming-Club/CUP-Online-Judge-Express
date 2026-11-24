import { definePort } from "./registry";

/** 比赛 / 专题助教。实现：infrastructure/persistence/contest/ContestAssistantManager */
export interface ContestAssistantRepository {
	getContestAssistants(contestId: number | string): Promise<any[]>;
	getAllContestAssistants(): Promise<any[]>;
	/** 含所属专题的助教；结果缓存 1 小时 */
	userIsContestAssistant(contestId: number | string, userId: string): Promise<boolean>;
	setContestAssistant(contestId: number | string, userId: string): Promise<unknown>;
	removeContestAssistant(contestId: number | string, userId: string): Promise<unknown>;
	setContestAssistantByTopicId(topicId: number | string, userId: string): Promise<unknown>;
	setContestAssistantByTopicIdAndMultipleUserId(topicId: number | string, userIdList: string[]): Promise<unknown>;
	deleteTopicAssistantList(topicId: number | string): Promise<unknown>;
}

export const contestAssistantRepository = definePort<ContestAssistantRepository>("ContestAssistantRepository");
