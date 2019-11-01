class OnlineUserSet {
	constructor() {
		this.__user__ = {};
	}

	get(userId) {
		return this.__user__[userId];
	}

	getAllValues() {
		return Object.values(this.__user__).filter(el => typeof el !== "undefined" && el !== null);
	}

	set(userId, payload) {
		this.__user__[userId] = payload;
		return this;
	}

	remove(userId) {
		delete this.__user__[userId];
	}
}

module.exports = new OnlineUserSet();
