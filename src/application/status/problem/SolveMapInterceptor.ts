import { ConfigInterceptor } from "../../../interfaces/http/interceptor/interceptor";
import { ConfigManager } from "../../../infrastructure/config/config-manager";
const { isAdministrator } = require("../../account/privilege");

export = ConfigInterceptor.newInstance().setSwitchKey("enable_solvemap").setDefaultValue(ConfigManager.SWITCH_ON).setAdditionalValidator(isAdministrator).build();
