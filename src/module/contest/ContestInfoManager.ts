import { contest as Contest } from "../../orm/ts-model";

class ContestInfoManager {
	async find (contestId: number) {
		return Contest.findOne({
			where: {
				contest_id: contestId
			}
		});
	}
}

export default new ContestInfoManager();
