const startupInit = require("../util").startupInit;


function safeFunctionCall (fn?: (...args: any[]) => any) {
	if (typeof fn === "function") {
		return fn();
	}
}

class InitExternalEnvironment {
	initQueue: ((...args: any[]) => any)[] = [];
	constructor() {
		this.addTask(startupInit);
	}

	addTask(fn: (...args: any[]) => void) {
		this.initQueue.push(fn);
	}

	run() {
		this.initQueue.forEach(fn => safeFunctionCall(fn));
	}

	async asyncRun() {
		for(const fn of this.initQueue) {
			await safeFunctionCall(fn);
		}
	}
}

export default new InitExternalEnvironment();
