import {ConfigInterceptor} from "./interceptor";
const {ConfigManager} = require("../../../application/ports/Config");
const {isAdministrator} = require("../privilege");
export default ConfigInterceptor.newInstance().setSwitchKey("enable_tutorial").setDefaultValue(ConfigManager.SWITCH_ON).setAdditionalValidator(isAdministrator).build();
