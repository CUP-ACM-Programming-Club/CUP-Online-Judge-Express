import {ConfigInterceptor} from "../../interfaces/http/interceptor/interceptor";
import {ConfigManager} from "../../infrastructure/config/config-manager";
import {isAdministrator} from "../account/privilege";
export = ConfigInterceptor.newInstance().setSwitchKey("enable_discuss").setDefaultValue(ConfigManager.SWITCH_ON).setAdditionalValidator(isAdministrator).build();
