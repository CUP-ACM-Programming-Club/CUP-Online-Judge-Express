import {ConfigInterceptor} from "./interceptor";
import {ConfigManager} from "../../../application/ports/Config";
import {isAdministrator} from "../privilege";
export = ConfigInterceptor.newInstance().setSwitchKey("enable_discuss").setDefaultValue(ConfigManager.SWITCH_ON).setAdditionalValidator(isAdministrator).build();
