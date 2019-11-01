const AwaitLock = require("await-lock").default;

class SegmentLock {
	constructor() {
		this.__lock__ = {};
	}

	async getLock(key) {
		if (!this.__lock__[key]) {
			this.__lock__[key] = new AwaitLock();
		}
		const lock = this.__lock__[key];
		await lock.acquireAsync();
	}

	release(key) {
		try {
			const lock = this.__lock__[key];
			if (lock) {
				lock.release();
			}

		} catch (e) {
			console.log(e);
		}
	}
}

module.exports = SegmentLock;
