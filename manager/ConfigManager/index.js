const {ConfigManager} = require("../../module/config/config-manager");

function ConfigSwitchManager () {

}

ConfigSwitchManager.prototype.getAllConfig = function () {
	return ConfigManager.getConfigMap();
};

ConfigSwitchManager.prototype.getAllSwitch = function () {
	return ConfigManager.getSwitchMap();
};

ConfigSwitchManager.prototype.getConfig = function (configKey) {
	return ConfigManager.getConfig(configKey, null);
};

ConfigSwitchManager.prototype.setConfig = function (configKey, configValue, comment) {
	return ConfigManager.setConfig(configKey, configValue, comment);
};

ConfigSwitchManager.prototype.removeConfig = function (configKey) {
	return ConfigManager.removeConfig(configKey);
};

ConfigSwitchManager.prototype.getSwitch = function (switchKey) {
	return ConfigManager.getSwitch(switchKey);
};

ConfigSwitchManager.prototype.setSwitch = function (key, value, comment) {
	return ConfigManager.setSwitch(key, value, comment);
};

ConfigSwitchManager.prototype.removeSwitch = function (key) {
	return ConfigManager.removeSwitch(key);
};


module.exports = new ConfigSwitchManager();
