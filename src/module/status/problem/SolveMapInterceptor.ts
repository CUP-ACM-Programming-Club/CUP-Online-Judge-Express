import { ConfigInterceptor } from "../../common/interceptor";
import { ConfigManager } from "../../config/config-manager";
const { isAdministrator } = require("../../account/privilege");

export = ConfigInterceptor.newInstance().setSwitchKey("enable_solvemap").setDefaultValue(ConfigManager.SWITCH_ON).setAdditionalValidator(isAdministrator).build();
