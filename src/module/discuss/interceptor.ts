import {ConfigInterceptor} from "../common/interceptor";
import {ConfigManager} from "../config/config-manager";
import {isAdministrator} from "../account/privilege";
export = ConfigInterceptor.newInstance().setSwitchKey("enable_discuss").setDefaultValue(ConfigManager.SWITCH_ON).setAdditionalValidator(isAdministrator).build();
