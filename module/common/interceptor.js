const Interceptor = require("../interceptor/middleware");
const {ConfigManager} = require("../config/config-manager");

class ConfigInterceptor {
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

	setSwitchKey (switchKey) {
		this.switchKey = switchKey;
		return this;
	}

	setAdditionalValidator (validator) {
		this.additionalValidator.push(validator);
		return this;
	}

	getDefaultValue () {
		return this.defaultValue;
	}

	setDefaultValue (value) {
		this.defaultValue = value;
		return this;
	}

	getErrorResponse () {
		return this.errorResponse;
	}

	setErrorResponse (response) {
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
		return function (req, res, next) {
			const condition = additionalValidator
				.map(element => element(req))
				.reduce((a, b) => a + b, 0);
			if (condition) {
				next();
			}
			else {
				middleware(req, res, next);
			}
		};
	}
}


module.exports = ConfigInterceptor;
