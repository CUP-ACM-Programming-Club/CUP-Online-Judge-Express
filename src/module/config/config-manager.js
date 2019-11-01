const random = require("random");
const dayjs = require("dayjs");
const BaseStore = require("./store/base/base-store");
const configStore = require("./store/config");
const cluster = require("cluster");
const switchStore = require("./store/switch");
const ConfigLoggerFactory = require("./log/config");
const SwitchLoggerFactory = require("./log/switch");
const OPERATION_CONSTANTS = require("./constants/operation");
const ErrorCollector = require("../error/collector");

function weakJsonParser(plainString) {
	try {
		return JSON.parse(plainString);
	} catch (e) {
		return plainString;
	}
}

function switchValueValidate(switchValue) {
	if (isNaN(switchValue = parseInt(switchValue))) {
		return false;
	}
	return switchValue >= 0 && switchValue <= 100;
}

function nowTimeInstance() {
	return {modify_time: dayjs().format("YYYY-MM-DD HH:mm:ss")};
}

function configPersistence(payload) {
	Object.assign(payload, nowTimeInstance());
	if (typeof this === "undefined") {
		return;
	}
	if (typeof this.configPersistenceModule === "undefined") {
		return;
	}
	this.configPersistenceModule.set(payload);
}

function configRemove(key) {
	if (!(this && this.configPersistenceModule)) {
		return;
	}
	this.configPersistenceModule.remove(key);
}

function switchPersistence(payload) {
	Object.assign(payload, nowTimeInstance());
	if (typeof this === "undefined") {
		return;
	}
	if (typeof this.switchPersistenceModule === "undefined") {
		return;
	}
	this.switchPersistenceModule.set(payload);
}

function switchRemove(key) {
	if (!(this && this.switchPersistenceModule)) {
		return;
	}
	this.switchPersistenceModule.remove(key);
}

function clusterHandler(thisArg, setter) {
	if (!cluster.isMaster) {
		process.on("message", (data) => {
			if (!data.configManager) {
				return;
			}
			setter[data.method].apply(thisArg, Array.isArray(data.args) ? data.args : Object.values(data.args));
		});
	}
}

function ConfigManager() {
	this.__data__ = {};
	this.__data__.__switchMap__ = {};
	this.__data__.__configMap__ = {};
	Object.defineProperty(this.__data__, "switchMap", {
		get: () => {
			return this.__data__.__switchMap__;
		}
	});
	Object.defineProperty(this.__data__, "configMap", {
		get: () => {
			return this.__data__.__configMap__;
		}
	});
	this.configLogger = ConfigLoggerFactory({set: this.setConfig, remove: this.removeConfig});
	this.switchLogger = SwitchLoggerFactory({set: this.setSwitch, remove: this.removeSwitch});
	clusterHandler(this, {"setConfig": this.setConfigWithoutStore, "setSwitch": this.setSwitchWithoutStore});
}

ConfigManager.prototype.getRandom = function () {
	return random.uniform(1, 100)();
};

ConfigManager.prototype.getConfig = function (configKey, defaultValue) {
	const wrappedValue = this.__data__.configMap[configKey];
	if (typeof wrappedValue === "undefined") {
		return defaultValue;
	}
	if (typeof wrappedValue.value === "string") {
		return weakJsonParser(wrappedValue.value);
	}
	return wrappedValue.value;
};

ConfigManager.prototype.getJSONConfig = function (configKey, defaultValue) {
	const response = this.getConfig(configKey, defaultValue);
	try {
		if (typeof response === "string") {
			return JSON.parse(response);
		}
		else {
			return defaultValue;
		}
	}
	catch (e) {
		console.log(e);
		ErrorCollector.push(__filename, e);
		return defaultValue;
	}
};

ConfigManager.prototype.getArrayConfig = function (configKey, defaultValue) {
	return this.getJSONConfig(configKey, defaultValue);
};

ConfigManager.prototype.getObjectConfig = function (configKey, defaultValue) {
	return this.getJSONConfig(configKey, defaultValue);
};

ConfigManager.prototype.setConfigWithoutStore = function (configKey, configValue, comment) {
	this.__data__.configMap[configKey] = {value: configValue, comment};
};

ConfigManager.prototype.boardcastSetter = function (method, args) {
	const payload = {
		method,
		configManager: true
	};
	payload.args = args;
	process.send(payload);
};

ConfigManager.prototype.boardcastSetConfig = function () {
	this.boardcastSetter("setConfig", arguments);
};

ConfigManager.prototype.setConfig = function (configKey, configValue, comment) {
	const payload = {value: configValue, comment};
	this.setConfigWithoutStore(configKey, configValue, comment);
	this.boardcastSetConfig(configKey, configValue, comment);
	configPersistence.call(this, Object.assign(payload, {key: configKey}));
	this.configLogger.log(OPERATION_CONSTANTS.SET, {key: configKey, value: configValue, comment});
	return this;
};

ConfigManager.prototype.removeConfig = function (configKey) {
	if (this.getConfig(configKey, null) === null) {
		return this;
	}
	const {value, comment} = this.getConfig(configKey, null);
	this.configLogger.log(OPERATION_CONSTANTS.DELETE, {key: configKey, value, comment});
	delete this.__data__.configMap[configKey];
	configRemove.call(this, configKey);
	return this;
};

ConfigManager.prototype.isSwitchedOn = function (configKey, defaultValue = 0) {
	const wrappedValue = this.__data__.switchMap[configKey];
	const randomValue = this.getRandom();
	if (typeof wrappedValue === "undefined" || typeof wrappedValue.value !== "number") {
		return typeof defaultValue === "number" ? randomValue <= defaultValue : false;
	}
	return randomValue <= wrappedValue.value;
};

ConfigManager.prototype.getSwitch = function (configKey) {
	// eslint-disable-next-line no-prototype-builtins
	if (this.__data__.switchMap.hasOwnProperty(configKey)) {
		return this.__data__.switchMap[configKey];
	}
	return null;
};

ConfigManager.prototype.setSwitchWithoutStore = function (configKey, switchValue, comment) {
	this.__data__.switchMap[configKey] = {value: parseInt(switchValue), comment};
};

ConfigManager.prototype.boardcastSetSwitch = function () {
	this.boardcastSetter("setSwitch", arguments);
};

ConfigManager.prototype.setSwitch = function (configKey, switchValue, comment) {
	if (!switchValueValidate(switchValue)) {
		return this;
	}
	const payload = {value: parseInt(switchValue), comment};
	this.setSwitchWithoutStore(configKey, switchValue, comment);
	this.boardcastSetSwitch(configKey, switchValue, comment);
	switchPersistence.call(this, Object.assign(payload, {key: configKey}));
	this.switchLogger.log(OPERATION_CONSTANTS.SET, {key: configKey, value: switchValue, comment});
	return this;
};

ConfigManager.prototype.removeSwitch = function (configKey) {
	if (this.getSwitch(configKey) === null) {
		return this;
	}
	const {value, comment} = this.__data__.switchMap[configKey];
	this.switchLogger.log(OPERATION_CONSTANTS.DELETE, {key: configKey, value, comment});
	delete this.__data__.switchMap[configKey];
	switchRemove.call(this, configKey);
	return this;
};

ConfigManager.prototype.getConfigMap = function () {
	return this.__data__.configMap;
};

ConfigManager.prototype.getSwitchMap = function () {
	return this.__data__.switchMap;
};

ConfigManager.prototype.setConfigPersistenceModule = function (module) {
	if (module instanceof BaseStore) {
		this.configPersistenceModule = module;
	}
	return this;
};

ConfigManager.prototype.setSwitchPersistenceModule = function (module) {
	if (module instanceof BaseStore) {
		this.switchPersistenceModule = module;
	}
	return this;
};

async function baseMapInitHandler (thisArg, module, setter) {
	if (typeof module !== "undefined") {
		const result = await module.getAll();
		result.forEach(el => setter.call(thisArg, el.key, el.value, el.comment));
	}
}

ConfigManager.prototype.initConfigMap = function () {
	baseMapInitHandler(this, this.configPersistenceModule, this.setConfigWithoutStore);
	return this;
};

ConfigManager.prototype.initSwitchMap = function () {
	baseMapInitHandler(this, this.switchPersistenceModule, this.setSwitchWithoutStore);
	return this;
};

ConfigManager.prototype.useMySQLStore = function () {
	this.setConfigPersistenceModule(new configStore.mysql());
	this.setSwitchPersistenceModule(new switchStore.mysql());
	return this;
};

ConfigManager.prototype.useRedisStore = function () {
	this.setConfigPersistenceModule(new configStore.redis());
	this.setSwitchPersistenceModule(new switchStore.redis());
	return this;
};

ConfigManager.prototype.SWITCH_ON = 100;

ConfigManager.prototype.SWITCH_OFF = 0;

module.exports = {ConfigManager: new ConfigManager(), configStore: require("./store/config"), switchStore: require("./store/switch")};
