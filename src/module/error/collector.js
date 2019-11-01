const dayjs = require("dayjs");

class ErrorCollector {
	constructor() {
		this.__error__ = {};
	}

	push(fileName, error) {
		const errorObject = {
			time: dayjs().format("YYYY-MM-DD HH:mm:ss"),
			content: error
		};
		const errorList = this.__error__[fileName] || (this.__error__[fileName] = []);
		errorList.push(errorObject);
		return this;
	}

	getErrorByFileName(fileName) {
		return this.__error__[fileName] || [];
	}

	getAllError() {
		return this.__error__;
	}
}

module.exports  = new ErrorCollector();
