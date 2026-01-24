class SubmissionCollector {
	_queue: any[];
	constructor() {
		this._queue = [];
	}
	addTask(fn: any) {
		this._queue.push(fn);
	}
	run() {
		for (const fn of this._queue) {
			fn();
		}
	}
	newInstance() {
		return new SubmissionCollector();
	}
}

export = new SubmissionCollector();