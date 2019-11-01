class SolutionUserCollector {
	constructor() {
		this.__collector__ = {};
	}

	set(solution_id, payload) {
		this.__collector__[solution_id] = payload;
	}

	get(solution_id) {
		return this.__collector__[solution_id] || null;
	}
}

module.exports = new SolutionUserCollector();
