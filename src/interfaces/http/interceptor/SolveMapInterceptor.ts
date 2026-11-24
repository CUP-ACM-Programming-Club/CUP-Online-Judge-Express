import { ConfigInterceptor } from "./interceptor";
import { ConfigManager } from "../../../application/ports/Config";
const { isAdministrator } = require("../privilege");

export = ConfigInterceptor.newInstance().setSwitchKey("enable_solvemap").setDefaultValue(ConfigManager.SWITCH_ON).setAdditionalValidator(isAdministrator).build();
