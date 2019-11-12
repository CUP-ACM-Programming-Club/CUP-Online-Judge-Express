interface UserMap {
	[id: string]: any
}
export class OnlineUserSet {
	private readonly __user__: UserMap;
	constructor() {
		this.__user__ = {};
	}

	get(userId: string) {
		return this.__user__[userId];
	}

	getAllValues() {
		return Object.values(this.__user__).filter(el => typeof el !== "undefined" && el !== null);
	}

	set(userId: string, payload: any) {
		this.__user__[userId] = payload;
		return this;
	}

	remove(userId: string) {
		if (Object.prototype.hasOwnProperty.call(this.__user__, userId)) {
			delete this.__user__[userId];
		}
		return this;
	}
}

export default new OnlineUserSet();
