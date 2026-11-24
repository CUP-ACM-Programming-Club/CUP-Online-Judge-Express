import { Request } from "express";
import { ErrorHandlerFactory } from "../../../shared/decorators/ErrorHandler";
import { ok } from "../../../domain/constants/state";
import ContestAssistantUseCases from "../../../application/contest/ContestAssistantUseCases";

/** HTTP 适配：比赛 / 专题助教。结果与异常包成 {status, data|statement}。 */
class ContestAssistantController {
	@ErrorHandlerFactory(ok.okMaker)
	async getContestAssistants(req: Request) {
		return await ContestAssistantUseCases.getContestAssistants(req.params.contestId);
	}

	@ErrorHandlerFactory(ok.okMaker)
	async getAllContestAssistants(req: Request) {
		return await ContestAssistantUseCases.getAllContestAssistants();
	}

	/** 当前登录用户是否为该比赛助教 */
	@ErrorHandlerFactory(ok.okMaker)
	async userIsContestAssistant(req: Request) {
		return await ContestAssistantUseCases.userIsContestAssistant(req.params.contest_id, req.session!.user_id);
	}

	@ErrorHandlerFactory(ok.okMaker)
	async setContestAssistant(req: Request) {
		return await ContestAssistantUseCases.setContestAssistant(req.body.contestId, req.body.userId);
	}

	@ErrorHandlerFactory(ok.okMaker)
	async setContestAssistantByTopic(req: Request) {
		return await ContestAssistantUseCases.setTopicAssistant(req.params.topicId || req.body.topicId, req.body.userId);
	}

	@ErrorHandlerFactory(ok.okMaker)
	async removeContestAssistant(req: Request) {
		return await ContestAssistantUseCases.removeContestAssistant(req.body.contestId, req.body.userId);
	}
}

export default new ContestAssistantController();
