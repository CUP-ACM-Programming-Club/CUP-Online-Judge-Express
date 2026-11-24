import { contestRepository } from "../ports/ContestRepository";

class ContestInfoManager {
	/** 返回 ORM 模型实例（或 null），调用方用 .get() 取值 */
	async find (contestId: number) {
		return contestRepository.findContestModel(contestId);
	}

	/** 比赛的前端配置项（目前只有是否显示查重） */
	async getConfig(contestId: number) {
		const contestInfo: any = (await this.find(contestId))!.get();
		return {
			showSim: contestInfo.showSim
		};
	}
}

export default new ContestInfoManager();
