const Interceptor = require("../interceptor/middleware");
const {ConfigManager} = require("../config/config-manager");


module.exports = function (switchKey, defaultValue, errorResponse = undefined) {
	const InterceptorFactory = new Interceptor();
	InterceptorFactory.setValidator(function () {
		return ConfigManager.isSwitchedOn(switchKey, defaultValue);
	});
	if (typeof errorResponse !== "undefined") {
		InterceptorFactory.setErrorResponse(errorResponse);
	}
	return InterceptorFactory.getInterceptorInstance();
};
