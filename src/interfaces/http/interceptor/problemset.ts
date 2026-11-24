import { ConfigInterceptor } from "./interceptor";
import { ConfigManager } from "../../../application/ports/Config";
const { isAdministrator } = require("../privilege");
const interceptor = ConfigInterceptor.newInstance().setSwitchKey("enable_problemset").setDefaultValue(ConfigManager.SWITCH_ON).setAdditionalValidator(isAdministrator).build();
export = interceptor;
