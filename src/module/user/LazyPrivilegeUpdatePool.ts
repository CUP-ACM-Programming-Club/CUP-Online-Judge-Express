interface UserMap {
}
class Pool {
    map: UserMap;
	constructor() {
		this.map = {};
	}

	addToUpdate(user_id: string) {
		const map = this.map;
		map[user_id] = true;
	}

	needUpdate(user_id: string) {
		const map = this.map;
		return map[user_id];
	}
}

module.exports = new Pool();
