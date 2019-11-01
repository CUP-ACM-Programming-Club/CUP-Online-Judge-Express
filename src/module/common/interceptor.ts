import {Interceptor} from "../interceptor/middleware";
import {Request, Response, NextFunction} from "express";
const {ConfigManager} = require("../config/config-manager");

export class ConfigInterceptor {
	private readonly interceptorFactory: Interceptor;
	private readonly additionalValidator: ((...args: any[]) => boolean)[];
	private switchKey: string | undefined;
	defaultValue: number | undefined;
	errorResponse: object | undefined;
	constructor() {
		this.interceptorFactory = new Interceptor();
		this.additionalValidator = [];
	}

	static newInstance() {
		return new ConfigInterceptor();
	}

	getSwitchKey () {
		return this.switchKey;
	}

	setSwitchKey (switchKey: string) {
		this.switchKey = switchKey;
		return this;
	}

	setAdditionalValidator (validator: (...args: any[]) => boolean) {
		this.additionalValidator.push(validator);
		return this;
	}

	getDefaultValue () {
		return this.defaultValue;
	}

	setDefaultValue (value: number) {
		this.defaultValue = value;
		return this;
	}

	getErrorResponse () {
		return this.errorResponse;
	}

	setErrorResponse (response: object) {
		this.errorResponse = response;
		return this;
	}

	build() {
		const interceptorFactory = this.interceptorFactory;
		const additionalValidator = this.additionalValidator;
		const {switchKey, defaultValue} = this;
		interceptorFactory.setValidator(function () {
			return ConfigManager.isSwitchedOn(switchKey, defaultValue);
		});

		if (typeof this.errorResponse !== "undefined") {
			interceptorFactory.setErrorResponse(this.errorResponse);
		}
		const middleware = interceptorFactory.getInterceptorInstance();
		return function (req: Request, res: Response, next: NextFunction) {
			const condition = additionalValidator
				.map(element => element(req))
				.reduce((a, b) => a || b, false);
			if (condition) {
				next();
			}
			else {
				middleware(req, res, next);
			}
		};
	}
}
