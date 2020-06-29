import { contest as Contest } from "../../orm/ts-model";
import { Request } from "express";
import {ErrorHandlerFactory} from "../../decorator/ErrorHandler";
import {ok} from "../constants/state";

class ContestInfoManager {
	async find (contestId: number) {
		return Contest.findOne({
			where: {
				contest_id: contestId
			}
		});
	}

	@ErrorHandlerFactory(ok.okMaker)
	async getConfigByRequest(req: Request) {
		const contestId: number = parseInt(req.params.contestId);
		const contestInfo: Contest = (await this.find(contestId))!.get() as Contest;
		return {
			showSim: contestInfo.showSim
		}
	}
}

export default new ContestInfoManager();
