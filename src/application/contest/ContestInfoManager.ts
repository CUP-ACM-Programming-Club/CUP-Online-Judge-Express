import { contestRepository } from "../ports/ContestRepository";
import { Request } from "express";
import {ErrorHandlerFactory} from "../../shared/decorators/ErrorHandler";
import {ok} from "../../domain/constants/state";

class ContestInfoManager {
	/** 返回 ORM 模型实例（或 null），调用方用 .get() 取值 */
	async find (contestId: number) {
		return contestRepository.findContestModel(contestId);
	}

	@ErrorHandlerFactory(ok.okMaker)
	async getConfigByRequest(req: Request) {
		const contestId: number = parseInt(req.params.contestId);
		const contestInfo: any = (await this.find(contestId))!.get();
		return {
			showSim: contestInfo.showSim
		}
	}
}

export default new ContestInfoManager();
