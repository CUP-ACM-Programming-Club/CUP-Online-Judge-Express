const {error} = require("../constants/state");

function baseValidator() {
	return false;
}

let errorResponse = error.unavailable;

function Interceptor() {
	this.validator = baseValidator;
	errorResponse = error.unavailable;
}

Interceptor.prototype.setValidator = function (validator) {
	if (typeof validator !== "function") {
		throw new Error("validator should be a function");
	}
	this.validator = validator;
};

Interceptor.prototype.setErrorResponse = function (response) {
	errorResponse = Object.assign(Object.assign({}, error.unavailable), response);
};

Interceptor.prototype.getInterceptorInstance = function () {
	const validator = this.validator || baseValidator;
	return function (req, res, next) {
		const response = validator(req, res);
		if (response && typeof next === "function") {
			next();
		} else {
			res.json(errorResponse);
		}
	};
};

module.exports = Interceptor;
