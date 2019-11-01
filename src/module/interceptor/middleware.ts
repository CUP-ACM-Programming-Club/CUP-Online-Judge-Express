const {error} = require("../constants/state");
import {Request, Response, NextFunction} from "express"

function baseValidator() {
	return false;
}

export class Interceptor {
    validator: (...args: any[]) => boolean;
	errorResponse: any;
	constructor () {
		this.validator = baseValidator;
		this.errorResponse = error.unavailable;
	}

	setValidator (validator: () => boolean) {
		this.validator = validator;
	}

	getValidator () {
		return this.validator;
	}

	setErrorResponse (response: object) {
		this.errorResponse = Object.assign(Object.assign({}, error.unavailable), response);
	}

	getInterceptorInstance () {
		const validator = this.validator || baseValidator;
		const errorResponse = this.errorResponse;
		return function (req: Request, res: Response, next: NextFunction) {
			const response = validator(req, res);
			if (response && typeof next === "function") {
				next();
			} else {
				res.json(errorResponse);
			}
		};
	}
}
