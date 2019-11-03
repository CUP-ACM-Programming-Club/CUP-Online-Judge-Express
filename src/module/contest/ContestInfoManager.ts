import sequelize from "../../orm/instance/sequelize";
const Contest = sequelize.import("contest", require("../../orm/models/contest"));

class ContestInfoManager {
	private contestId: number | undefined;
	constructor () {}

	static newInstance() {
		return new ContestInfoManager();
	}

	setContestId (contestId: number) {
		this.contestId = contestId;
		return this;
	}

	async find () {
		return Contest.findOne({
			where: {
				contest_id: this.contestId
			}
		});
	}
}

module.exports = ContestInfoManager;
