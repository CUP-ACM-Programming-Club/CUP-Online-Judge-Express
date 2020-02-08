import random from "random";
import dayjs from "dayjs";
import cluster from "cluster";
import {BaseStore} from "./store/base/base-store";
import * as configStore from "./store/config";
import * as switchStore from "./store/switch";
const ConfigLoggerFactory = require("./log/config");
const SwitchLoggerFactory = require("./log/switch");
const OPERATION_CONSTANTS = require("./constants/operation");
const ErrorCollector = require("../error/collector");

function weakJsonParser(plainString: string) {
    try {
        return JSON.parse(plainString);
    } catch (e) {
        return plainString;
    }
}

function switchValueValidate(switchValue: any) {
    if (isNaN(switchValue = parseInt(switchValue))) {
        return false;
    }
    return switchValue >= 0 && switchValue <= 100;
}

function nowTimeInstance() {
    return {modify_time: dayjs().format("YYYY-MM-DD HH:mm:ss")};
}



export class ConfigManager {
    __data__ = {
        __switchMap__ : {},
        __configMap__ : {},
        get switchMap(): any {
            return this.__switchMap__;
        },
        get configMap(): any {
            return this.__configMap__;
        }
    };

    private configRemove(key: string) {
        if (!(this && this.configPersistenceModule)) {
            return;
        }
        this.configPersistenceModule.remove(key);
    }

    configPersistenceModule!: any;
    switchPersistenceModule!: any;

    configLogger = ConfigLoggerFactory({set: this.setConfig, remove: this.removeConfig});
    switchLogger = SwitchLoggerFactory({set: this.setSwitch, remove: this.removeSwitch});

    constructor() {
        this.clusterHandler({"setConfig": this.setConfigWithoutStore, "setSwitch": this.setSwitchWithoutStore});
    }

    private clusterHandler(setter: any) {
        if (!cluster.isMaster) {
            process.on("message", (data) => {
                if (!data.configManager) {
                    return;
                }
                setter[data.method].apply(this, Array.isArray(data.args) ? data.args : Object.values(data.args));
            });
        }
    }

    getRandom() {
        return random.uniform(1,100)();
    }

    private configPersistence(payload: any) {
        Object.assign(payload, nowTimeInstance());
        if (typeof this === "undefined") {
            return;
        }
        if (typeof this.configPersistenceModule === "undefined") {
            return;
        }
        this.configPersistenceModule.set(payload);
    }

    private switchPersistence(payload: any) {
        Object.assign(payload, nowTimeInstance());
        if (typeof this === "undefined") {
            return;
        }
        if (typeof this.switchPersistenceModule === "undefined") {
            return;
        }
        this.switchPersistenceModule.set(payload);
    }

    getConfig(configKey: string, defaultValue: any) {
        const wrappedValue = this.__data__.configMap[configKey];
        if (typeof wrappedValue === "undefined") {
            return defaultValue;
        }
        if (typeof wrappedValue.value === "string") {
            return weakJsonParser(wrappedValue.value);
        }
        return wrappedValue;
    }

    getJSONConfig(configKey: string, defaultValue: any) {
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
    }

    getArrayConfig (configKey: string, defaultValue: any) {
        return this.getJSONConfig(configKey, defaultValue);
    }

    getObjectConfig(configKey: string, defaultValue: any) {
        return this.getJSONConfig(configKey, defaultValue);
    }

    setConfigWithoutStore(configKey: string, configValue: any, comment: string) {
        this.__data__.configMap[configKey] = {
            value: configValue,
            comment: comment
        }
    }

    broadcastSetter(method: string, args: any[]) {
        const payload = {
            method: method,
            configManager: true,
            args: args
        };
        process.send!(payload);
    }

    broadcastSetConfig(...args: any[]) {
        this.broadcastSetter("setConfig", args);
    }

    setConfig (configKey: string, configValue: any, comment: string) {
        const payload = {value: configValue, comment};
        this.setConfigWithoutStore(configKey, configValue, comment);
        this.broadcastSetConfig(configKey, configValue, comment);
        this.configPersistence(Object.assign(payload, {key: configKey}));
        return this;
    }

    removeConfig(configKey: string) {
        if (this.getConfig(configKey, null) === null) {
            return this;
        }
        const {value, comment} = this.getConfig(configKey, null);
        this.configLogger.log(OPERATION_CONSTANTS.DELETE, {key:configKey, value, comment});
        delete this.__data__.configMap[configKey];
        this.configRemove(configKey);
    }

    isSwitchedOn(configKey: string, defaultValue: any = 0) {
        const wrappedValue = this.__data__.switchMap[configKey];
        const randomValue = this.getRandom();
        if (typeof wrappedValue === "undefined" || typeof wrappedValue.value !== "number") {
            return typeof defaultValue === "number" ? randomValue <= defaultValue : false;
        }
        return randomValue <= wrappedValue.value;
    }

    getSwitch(configKey: string) {
        if (Object.prototype.hasOwnProperty.call(this.__data__.switchMap, configKey)) {
            return this.__data__.switchMap[configKey];
        }
        return null;
    }

    setSwitchWithoutStore(configKey: string, switchValue: number | string, comment: string) {
        this.__data__.switchMap[configKey] = {value: parseInt(switchValue as string), comment};
    }

    broadcastSetSwitch(...args: any[]) {
        this.broadcastSetter("setSwitch", args);
    }

    setSwitch(configKey: string, switchValue: number | string, comment: string) {
        if (!switchValueValidate(switchValue)) {
            return this;
        }
        const payload = {value: parseInt(switchValue as string), comment};
        this.setSwitchWithoutStore(configKey, switchValue, comment);
        this.broadcastSetSwitch(configKey, switchValue, comment);
        this.switchPersistence(Object.assign(payload, {key:configKey}));
        this.switchLogger.log(OPERATION_CONSTANTS.SET, {key: configKey, value: switchValue, comment});
        return this;
    }

    switchRemove(key: string) {
        this.switchPersistenceModule.remove(key);
        return this;
    }

    removeSwitch(configKey: string) {
        if (this.getSwitch(configKey) === null) {
            return this;
        }
        const {value, comment} = this.__data__.switchMap[configKey];
        this.switchLogger.log(OPERATION_CONSTANTS.DELETE, {key: configKey, value, comment});
        delete this.__data__.switchMap[configKey];
        this.switchRemove(configKey);
        return this;
    }

    getConfigMap() {
        return this.__data__.configMap;
    }

    getSwitchMap() {
        return this.__data__.switchMap;
    }

    setConfigPersistenceModule(module: BaseStore) {
        this.configPersistenceModule = module;
        return this;
    }

    setSwitchPersisteneModule(module: BaseStore) {
        this.switchPersistenceModule = module;
        return this;
    }

    private async baseMapInitHandler(module: any, setter: any) {
        if (typeof module !== "undefined") {
            const result =  await (module.getAll() as Promise<any>);
            result.forEach((el: any) => setter.call(this, el.key, el.value, el.comment));
        }
    }

    initConfigMap() {
        this.baseMapInitHandler(this.configPersistenceModule, this.setConfigWithoutStore);
        return this;
    }

    initSwitchMap() {
        this.baseMapInitHandler(this.switchPersistenceModule, this.setSwitchWithoutStore);
        return this;
    }

    useMySQLStore() {
        this.setConfigPersistenceModule(new configStore.mysql());
        this.setSwitchPersisteneModule(new switchStore.mysql());
        return this;
    }

    get SWITCH_ON() {
        return 100;
    }

    get SWITCH_OFF() {
        return 0;
    }
}

const configManager = new ConfigManager();
export default configManager;
