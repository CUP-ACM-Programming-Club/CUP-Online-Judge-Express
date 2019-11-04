interface Collector {
	[id: string]: any
}

class SolutionUserCollector {
    __collector__: Collector;
	constructor() {
		this.__collector__ = {};
	}

	set(solution_id: number | string, payload: any) {
		this.__collector__[solution_id] = payload;
	}

	get(solution_id: number | string) {
		return this.__collector__[solution_id] || null;
	}
}

export default new SolutionUserCollector();
