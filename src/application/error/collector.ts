import dayjs from "dayjs";

class ErrorCollector {
	private readonly __error__: any;
	constructor() {
		this.__error__ = {};
	}

	push(fileName: string, error: any) {
		const errorObject = {
			time: dayjs().format("YYYY-MM-DD HH:mm:ss"),
			content: error
		};
		const errorList = this.__error__[fileName] || (this.__error__[fileName] = []);
		errorList.push(errorObject);
		return this;
	}

	getErrorByFileName(fileName: string) {
		return this.__error__[fileName] || [];
	}

	getAllError() {
		return this.__error__;
	}
}

export = new ErrorCollector();
