const dayjs = require("dayjs");
const SegmentLock = require("../common/SegmentLock");
const segLock = new SegmentLock();

class CachePool {
	constructor() {
		this.__cache__ = {};
	}

	async get(key) {
		await segLock.getLock(key);
		try {
			if (this.__cache__ && Object.prototype.hasOwnProperty.call(this.__cache__, key) && this.__cache__[key]) {
				return this.__cache__[key];
			} else {
				return null;
			}
		}
		catch (e) {
			console.log(e);
			return null;
		}
		finally {
			segLock.release(key);
		}
	}

	getAllKey() {
		return Object.keys(this.__cache__);
	}

	async set(key, value) {
		segLock.getLock(key);
		this.__cache__[key] = {
			data: value,
			time: dayjs()
		};
		segLock.release(key);
	}

	remove(key) {
		if (this.__cache__ && Object.prototype.hasOwnProperty.call(this.__cache__, key) && this.__cache__[key]) {
			this.__cache__[key] = undefined;
		}
	}

	removeAll() {
		this.__cache__ = {};
	}
}

module.exports = CachePool;
