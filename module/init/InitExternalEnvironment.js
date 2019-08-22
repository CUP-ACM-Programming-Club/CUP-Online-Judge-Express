const startupInit = require("../util").startupInit;

function InitExternalEnvironment () {
	this.initQueue = [];
	this.addTask(startupInit);
}

function safeFunctionCall (fn) {
	if (typeof fn === "function") {
		return fn();
	}
}

InitExternalEnvironment.prototype.addTask = function (fn) {
	this.initQueue.push(fn);
};

InitExternalEnvironment.prototype.run = function () {
	this.initQueue.forEach(fn => safeFunctionCall(fn));
};

InitExternalEnvironment.prototype.asyncRun = async function () {
	for(const fn of this.initQueue) {
		await safeFunctionCall(fn);
	}
};

module.exports = new InitExternalEnvironment();