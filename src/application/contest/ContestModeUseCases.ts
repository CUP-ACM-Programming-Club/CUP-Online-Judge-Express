import { contestRepository } from "../ports/ContestRepository";

/** 比赛模式开关（global_setting.label = 'contest'），刷新到进程级的 global.contest_mode。 */
export class ContestModeUseCases {
	async refreshContestMode() {
		const result = await contestRepository.findContestModeSetting();
		// @ts-ignore
		global.contest_mode = !!(result && result[0] && result[0].value && parseInt(result[0].value));
	}
}

export default new ContestModeUseCases();
