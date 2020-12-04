import {ConfigManager} from "../config/config-manager";

class Logger {
    static log(...args: any[]) {
        if (ConfigManager.getSwitch("enable_debug_log", false)) {
            console.log(...args);
        }
    }
}

export default Logger;
