import {Dayjs} from "dayjs";
const dayjs = require("dayjs");
const SegmentLock = require("./SegmentLock");
const segLock = new SegmentLock();

interface CacheValue {
	data: any,
	time: Dayjs
}

interface Cache {
	[id: string]: CacheValue | undefined
}

class CachePool {
	private __cache__: Cache;
	constructor() {
		this.__cache__ = {};
	}

	async get(key: string) {
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

	async set(key: string, value: any) {
		await segLock.getLock(key);
		this.__cache__[key] = {
			data: value,
			time: dayjs()
		};
		segLock.release(key);
	}

	remove(key: string) {
		if (this.__cache__ && Object.prototype.hasOwnProperty.call(this.__cache__, key) && this.__cache__[key]) {
			this.__cache__[key] = undefined;
		}
	}

	removeAll() {
		this.__cache__ = {};
	}
}

export default CachePool;
