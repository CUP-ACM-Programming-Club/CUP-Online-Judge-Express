import {ConfigManager} from "../../module/config/config-manager";

class ConfigSwitchManager {
    getAllConfig() {
        return ConfigManager.getConfigMap();
    }

    getAllSwitch() {
        return ConfigManager.getSwitchMap();

    }

    getConfig(configKey: string) {
        return ConfigManager.getConfig(configKey, null);
    }

    setConfig(configKey: string, configValue: any, comment?: string) {
        return ConfigManager.setConfig(configKey, configValue, comment);

    }

    removeConfig(configKey: string) {
        return ConfigManager.removeConfig(configKey);

    }

    getSwitch(switchKey: string) {
        return ConfigManager.getSwitch(switchKey);
    }

    setSwitch(key: string, value: number | string, comment?: string) {
        return ConfigManager.setSwitch(key, value, comment);

    }

    removeSwitch(key: string) {
        return ConfigManager.removeSwitch(key);

    }
}

export default new ConfigSwitchManager();
