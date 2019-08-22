const query = require("../mysql_query");
const cache_query = require("../mysql_cache");
const DEFAULT_LOOP_SECONDS = 3000;
const localJudger = require("../judger");
async function collectHandler () {
	this.collectFinished = false;
	const result = await query("SELECT solution_id,user_id FROM solution WHERE result<2 and language not in (15,22)");
	for (let i in result) {
		if (!result.hasOwnProperty(i)) {
			continue;
		}
		const _data = await cache_query("SELECT count(1) as cnt from privilege where user_id = ? and rightstr = 'administrator'",
			[result[i].user_id]);
		const admin = !!(_data && _data.length && _data[0].cnt);
		const solutionId = parseInt(result[i].solution_id);
		const priority = parseInt(!!result[i].result);
		this.judger.addTask(solutionId, admin, false, !priority);
	}
	this.collectFinished = true;
}

function DatabaseSubmissionCollector () {
	this.judger = null;
	this.interval = null;
}

DatabaseSubmissionCollector.prototype.setJudger = function (judger) {
	if (judger instanceof localJudger) {
		this.judger = judger;
		return this;
	}
	else {
		return null;
	}
};

DatabaseSubmissionCollector.prototype.start = function () {
	if (this.interval === null) {
		const that = this;
		this.collectFinished = true;
		setInterval(() => {
			if (this.collectFinished) {
				collectHandler.call(that);
			}
		}, DEFAULT_LOOP_SECONDS);
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