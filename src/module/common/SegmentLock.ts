import AwaitLock from "await-lock";
import {ILock} from "./Lock";

interface LockEntity {
	[id: string]: AwaitLock
}

class SegmentLock implements ILock{
	private readonly __lock__: LockEntity;
	constructor() {
		this.__lock__ = {};
	}

	async getLock(key: string) {
		if (!this.__lock__[key]) {
			this.__lock__[key] = new AwaitLock();
		}
		const lock = this.__lock__[key];
		await lock.acquireAsync();
	}

	release(key: string) {
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

export default SegmentLock;
