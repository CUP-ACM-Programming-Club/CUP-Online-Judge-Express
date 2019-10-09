const dayjs = require("dayjs");

class MySQLCachePool {
	constructor() {
		this.__cache__ = {};
	}

	get(key) {
		if (this.__cache__ && this.__cache__.hasOwnProperty(key) && this.__cache__[key]) {
			return this.__cache__[key];
		} else {
			return null;
		}
	}

	getAllKey() {
		return Object.keys(this.__cache__);
	}

	set(key, value) {
		this.__cache__[key] = {
			data: value,
			time: dayjs()
		};
	}

	remove(key) {
		if (this.__cache__ && this.__cache__.hasOwnProperty(key) && this.__cache__[key]) {
			this.__cache__[key] = undefined;
		}
	}

	removeAll() {
		this.__cache__ = {};
	}
}

module.exports = new MySQLCachePool();
