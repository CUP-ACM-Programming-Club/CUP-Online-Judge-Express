const random = require("random");
const dayjs = require("dayjs");

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
	if (typeof this !== "undefined" && typeof this.configPersistenceModule === "function") {
		this.configPersistenceModule(payload);
	}
}

function switchPersistence(payload) {
	Object.assign(payload, nowTimeInstance());
	if (typeof this !== "undefined" && typeof this.switchPersistenceModule === "function") {
		this.switchPersistenceModule(payload);
	}
}

function Switch(enablePersistence = true) {
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

Switch.prototype.getRandom = function () {
	return random.uniform(1, 100)();
};

Switch.prototype.getConfig = function (configKey, defaultValue) {
	const wrappedValue = this.__data__.configMap[configKey];
	if (typeof wrappedValue === "undefined") {
		return defaultValue;
	}
	if (typeof wrappedValue.value === "string") {
		return weakJsonParser(wrappedValue.value);
	}
	return wrappedValue.value;
};

Switch.prototype.setConfig = function (configKey, configValue, comment) {
	const payload = {value: configValue, comment};
	this.__data__.configMap[configKey] = payload;
	configPersistence.call(this, payload);
	return this;
};

Switch.prototype.isSwitchedOn = function (configKey, defaultValue) {
	const wrappedValue = this.__data__.switchMap[configKey];
	const randomValue = this.getRandom();
	if (typeof wrappedValue === "undefined" || typeof wrappedValue.value !== "number") {
		return typeof defaultValue === "number" ? randomValue <= defaultValue : false;
	}
	return randomValue <= wrappedValue.value;
};

Switch.prototype.setSwitch = function (configKey, switchValue, comment) {
	if (!switchValueValidate(switchValue)) {
		return this;
	}
	const payload = {value: switchValue, comment};
	this.__data__.switchMap[configKey] = payload;
	switchPersistence(payload).call(this, payload);
	return this;
};

Switch.prototype.getConfigMap = function () {
	return this.__data__.configMap;
};

Switch.prototype.getSwitchMap = function () {
	return this.__data__.switchMap;
};

Switch.prototype.setConfigPersistenceModule = function (module) {
	if (typeof module === "function") {
		this.configPersistenceModule = module;
	}
	return this;
};

Switch.prototype.setSwitchPersistenceModule = function (module) {
	if (typeof module === "function") {
		this.switchPersistenceModule = module;
	}
	return this;
};

module.exports = new Switch();
