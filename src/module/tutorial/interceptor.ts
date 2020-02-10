import {ConfigInterceptor} from "../common/interceptor";
const {ConfigManager} = require("../config/config-manager");
const {isAdministrator} = require("../account/privilege");
export default ConfigInterceptor.newInstance().setSwitchKey("enable_tutorial").setDefaultValue(ConfigManager.SWITCH_ON).setAdditionalValidator(isAdministrator).build();
