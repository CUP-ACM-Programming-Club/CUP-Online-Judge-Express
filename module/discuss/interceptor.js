const {ConfigManager} = require("../config/config-manager");
const InterceptorFactory = require("../common/interceptor");
module.exports = InterceptorFactory("enable_discuss", ConfigManager.SWITCH_ON);
