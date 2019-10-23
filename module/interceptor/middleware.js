const {error} = require("../constants/state");

function baseValidator() {
	return false;
}

function Interceptor() {
	this.validator = baseValidator;
	this.errorResponse = error.unavailable;
}

Interceptor.prototype.setValidator = function (validator) {
	if (typeof validator !== "function") {
		throw new Error("validator should be a function");
	}
	this.validator = validator;
};

Interceptor.prototype.getValidator = function () {
	return this.validator;
};

Interceptor.prototype.setErrorResponse = function (response) {
	this.errorResponse = Object.assign(Object.assign({}, error.unavailable), response);
};

Interceptor.prototype.getInterceptorInstance = function () {
	const validator = this.validator || baseValidator;
	const errorResponse = this.errorResponse;
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
