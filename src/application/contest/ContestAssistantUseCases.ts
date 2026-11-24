import { contestAssistantRepository } from "../ports/ContestAssistantRepository";

/** 比赛 / 专题助教的用例。 */
export class ContestAssistantUseCases {
	async getContestAssistants(contestId: number | string) {
		return await contestAssistantRepository.getContestAssistants(contestId);
	}

	async getAllContestAssistants() {
		return await contestAssistantRepository.getAllContestAssistants();
	}

	async userIsContestAssistant(contestId: number | string, userId: string) {
		return await contestAssistantRepository.userIsContestAssistant(contestId, userId);
	}

	async setContestAssistant(contestId: number | string, userId: string) {
		await contestAssistantRepository.setContestAssistant(contestId, userId);
		return { contestId, userId };
	}

	async setTopicAssistant(topicId: number | string, userId: string) {
		await contestAssistantRepository.setContestAssistantByTopicId(topicId, userId);
		return { topicId, userId };
	}

	async removeContestAssistant(contestId: number | string, userId: string) {
		await contestAssistantRepository.removeContestAssistant(contestId, userId);
		return { contestId, userId };
	}

	/** 用 topicAssistant 整体替换专题助教名单 */
	async updateTopicAssistantList(topicId: number | string, topicAssistant: string[]) {
		await contestAssistantRepository.deleteTopicAssistantList(topicId);
		await contestAssistantRepository.setContestAssistantByTopicIdAndMultipleUserId(topicId, topicAssistant);
	}
}

export default new ContestAssistantUseCases();
