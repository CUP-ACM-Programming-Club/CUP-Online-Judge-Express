import { contest as Contest } from "../../infrastructure/orm/ts-model";
import { Request } from "express";
import {ErrorHandlerFactory} from "../../shared/decorators/ErrorHandler";
import {ok} from "../../domain/constants/state";

class ContestInfoManager {
	async find (contestId: number) {
		return Contest.findOne({
			// 直接使用列名 contest_id（模型属性名为 contestId）；sequelize 会原样作为列名，v6 类型需显式放宽
			where: {
				contest_id: contestId
			} as any
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
