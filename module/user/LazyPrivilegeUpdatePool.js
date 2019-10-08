class Pool {
	constructor() {
		this.map = {};
	}

	addToUpdate(user_id) {
		const map = this.map;
		map[user_id] = true;
	}

	needUpdate(user_id) {
		const map = this.map;
		return !!map[user_id];
	}
}

module.exports = new Pool();
