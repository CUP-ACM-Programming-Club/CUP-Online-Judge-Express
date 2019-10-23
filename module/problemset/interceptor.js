const {ConfigManager} = require("../config/config-manager");
const InterceptorFactory = require("../common/interceptor");
const {isAdministrator} = require("../account/privilege");
module.exports = InterceptorFactory.newInstance().setSwitchKey("enable_problemset").setDefaultValue(ConfigManager.SWITCH_ON).setAdditionalValidator(isAdministrator).build();
