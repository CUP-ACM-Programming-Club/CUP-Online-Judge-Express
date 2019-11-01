import {ConfigInterceptor} from "../common/interceptor";
const {ConfigManager} = require("../config/config-manager");
const {isAdministrator} = require("../account/privilege");
const interceptor = ConfigInterceptor.newInstance().setSwitchKey("enable_problemset").setDefaultValue(ConfigManager.SWITCH_ON).setAdditionalValidator(isAdministrator).build();
module.exports = interceptor;
