import {ConfigInterceptor} from "../../common/interceptor";
const {ConfigManager} = require("../../config/config-manager");
const {isAdministrator} = require("../../account/privilege");

module.exports = ConfigInterceptor.newInstance().setSwitchKey("enable_solvemap").setDefaultValue(ConfigManager.SWITCH_ON).setAdditionalValidator(isAdministrator).build();
