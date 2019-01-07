module.exports = function startLoopJudge(time = 1000) {
	if (typeof time !== "number") {
		return new TypeError("variable time must be a number");
	}
	if (this.isLooping()) {
		this.stopLoopJudge();
	}
	this.loopingFlag = true;
	this.loopJudgeFlag = setInterval(() => {
		this.collectSubmissionFromDatabase();
	}, time);
};
