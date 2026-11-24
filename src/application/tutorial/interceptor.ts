import {ConfigInterceptor} from "../../interfaces/http/interceptor/interceptor";
const {ConfigManager} = require("../../infrastructure/config/config-manager");
const {isAdministrator} = require("../account/privilege");
export default ConfigInterceptor.newInstance().setSwitchKey("enable_tutorial").setDefaultValue(ConfigManager.SWITCH_ON).setAdditionalValidator(isAdministrator).build();
