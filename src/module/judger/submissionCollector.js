function SubmissionCollector() {
	this._queue = [];
}

SubmissionCollector.prototype.addTask = function (fn) {
	this._queue.push(fn);
};

SubmissionCollector.prototype.run = function () {
	for (const fn of this._queue) {
		fn();
	}
};

SubmissionCollector.prototype.newInstance = function () {
	return new SubmissionCollector();
};

module.exports = new SubmissionCollector();