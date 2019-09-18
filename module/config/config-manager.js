const random = require("random");
const dayjs = require("dayjs");
const {baseStore} = require("./store/base/base-store");
const configStore = require("./store/config");
const switchStore = require("./store/switch");

function weakJsonParser(plainString) {
	try {
		return JSON.parse(plainString);
	} catch (e) {
		return plainString;
	}
}

function switchValueValidate(switchValue) {
	if (typeof switchValue !== "number") {
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

function ConfigManager(enablePersistence = true) {
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

	if (enablePersistence) {
		this.query = require("../mysql_query");
	}
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

ConfigManager.prototype.setConfig = function (configKey, configValue, comment) {
	const payload = {value: configValue, comment};
	this.__data__.configMap[configKey] = payload;
	configPersistence.call(this, payload);
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

ConfigManager.prototype.setSwitch = function (configKey, switchValue, comment) {
	if (!switchValueValidate(switchValue)) {
		return this;
	}
	const payload = {value: switchValue, comment};
	this.__data__.switchMap[configKey] = payload;
	switchPersistence(payload).call(this, payload);
	return this;
};

ConfigManager.prototype.getConfigMap = function () {
	return this.__data__.configMap;
};

ConfigManager.prototype.getSwitchMap = function () {
	return this.__data__.switchMap;
};

ConfigManager.prototype.setConfigPersistenceModule = function (module) {
	if (module instanceof baseStore) {
		this.configPersistenceModule = module;
	}
	return this;
};

ConfigManager.prototype.setSwitchPersistenceModule = function (module) {
	if (module instanceof baseStore) {
		this.switchPersistenceModule = module;
	}
	return this;
};

ConfigManager.prototype.useMySQLStore = function () {
	this.setConfigPersistenceModule(configStore.mysql);
	this.setSwitchPersistenceModule(switchStore.mysql);
};

ConfigManager.prototype.useRedisStore = function () {
	this.setConfigPersistenceModule(configStore.redis);
	this.setSwitchPersistenceModule(switchStore.redis);
};

module.exports = {ConfigManager: new ConfigManager(), configStore: require("./store/config"), switchStore: require("./store/switch")};
