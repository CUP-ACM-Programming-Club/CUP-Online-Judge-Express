const query = require("../mysql_query");
const cache_query = require("../mysql_cache");
const {ConfigManager} = require("../config/config-manager");
const DEFAULT_LOOP_SECONDS = 3000;
const SUBMISSION_COLLECT_LIMIT = 30;

function isJudgerGraySolutionId (solutionId) {
	solutionId = parseInt(solutionId);
	const grayList = ConfigManager.getArrayConfig("judger_solution_gray_solution_id", []);
	if (Array.isArray(grayList)) {
		return grayList.map(e => parseInt(e)).includes(solutionId);
	}
	else {
		return false;
	}
}

async function collectHandler () {
	try {
		this.collectFinished = false;
		const result = await query("SELECT solution_id,user_id FROM solution WHERE result<2 and language not in (15,22) order by solution_id limit ?", [ConfigManager.getConfig("submission_collect_limit", SUBMISSION_COLLECT_LIMIT)]);
		for (let i in result) {
			if (!Object.prototype.hasOwnProperty.call(result,i)) {
				continue;
			}
			const _data = await cache_query("SELECT count(1) as cnt from privilege where user_id = ? and rightstr = 'administrator'",
				[result[i].user_id]);
			const admin = !!(_data && _data.length && _data[0].cnt);
			const solutionId = parseInt(result[i].solution_id);
			const priority = parseInt(!!result[i].result);
			this.judger.addTask(solutionId, admin, false, !priority, isJudgerGraySolutionId(solutionId));
		}
	}
	catch (e) {
		console.log(e);
	}
	this.collectFinished = true;
}

function DatabaseSubmissionCollector () {
	this.judger = null;
	this.interval = null;
}

DatabaseSubmissionCollector.prototype.setJudger = function (judger) {
	this.judger = judger;
	return this;
};

DatabaseSubmissionCollector.prototype.start = function () {
	if (this.interval === null) {
		const that = this;
		this.collectFinished = true;
		this.interval = setInterval(() => {
			if (this.collectFinished) {
				collectHandler.call(that);
			}
		}, ConfigManager.getConfig("judger_loop_time", DEFAULT_LOOP_SECONDS));
		return true;
	}
	else {
		return false;
	}
};

DatabaseSubmissionCollector.prototype.stop = function () {
	if (this.interval !== null) {
		clearInterval(this.interval);
		return true;
	}
	return false;
};

DatabaseSubmissionCollector.prototype.newInstance = function () {
	return new DatabaseSubmissionCollector();
};

module.exports = new DatabaseSubmissionCollector();
