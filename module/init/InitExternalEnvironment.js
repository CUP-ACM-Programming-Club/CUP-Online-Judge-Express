const startupInit = require("../util").startupInit();

function InitExternalEnvironment () {
	this.initQueue = [];
	this.addTask(startupInit);
}

InitExternalEnvironment.prototype.addTask = function (fn) {
	this.initQueue.push(fn);
};

InitExternalEnvironment.prototype.run = function () {
	for(const fn of this.initQueue)  {
		fn();
	}
};

InitExternalEnvironment.prototype.asyncRun = async function () {
	for(const fn of this.initQueue) {
		await fn();
	}
};

module.exports = new InitExternalEnvironment();