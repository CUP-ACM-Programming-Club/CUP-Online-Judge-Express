const sequelize = require("../../orm/instance/sequelize");
const Contest = sequelize.import("contest", require("../../orm/models/contest"));

class ContestInfoManager {
	constructor () {}

	static newInstance() {
		return new ContestInfoManager();
	}

	setContestId (contestId) {
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
