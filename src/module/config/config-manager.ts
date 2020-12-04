import dayjs from "dayjs";
import cluster from "cluster";
import {PersistenceStore} from "./store/base/store";
import {config as Config, Switch} from "../../orm/ts-model";
import * as configStoreCollection from "./store/config";
import * as switchStoreCollection from "./store/switch";
import * as OPERATION_CONSTANTS from "./constants/operation";
import ConfigLoggerFactory from "./log/config";
import SwitchLoggerFactory from "./log/switch";
import ErrorCollector from "../error/collector";

const random = require("random");

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

interface DataStoragePayload {
    [key: string]: any
}

interface DataStorage {
    __switchMap__: DataStoragePayload,
    __configMap__: DataStoragePayload,
    readonly configMap: DataStoragePayload,
    readonly switchMap: DataStoragePayload
}

export class SystemConfigManager {
    SWITCH_ON = 100;
    SWITCH_OFF = 0;
    __data__!: DataStorage;
    configLogger!: any;
    switchLogger!: any;
    switchPersistenceModule?: PersistenceStore<Switch>;
    configPersistenceModule?: PersistenceStore<Config>;

    constructor() {
        this.__data__ = {
            __switchMap__: {},
            __configMap__: {}
        } as any;
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
        this.clusterHandler({"setConfig": this.setConfigWithoutStore, "setSwitch": this.setSwitchWithoutStore});
    }

    setConfigWithoutStore(configKey: string, configValue: any, comment?: string) {
        this.__data__.configMap[configKey] = {value: configValue, comment};
    };

    switchPersistence(payload: any) {
        Object.assign(payload, nowTimeInstance());
        if (typeof this === "undefined") {
            return;
        }
        if (typeof this.switchPersistenceModule === "undefined") {
            return;
        }
        this.switchPersistenceModule.set(payload);
    }

    configPersistence(payload?: any) {
        Object.assign(payload, nowTimeInstance());
        if (typeof this === "undefined") {
            return;
        }
        if (typeof this.configPersistenceModule === "undefined") {
            return;
        }
        this.configPersistenceModule.set(payload);
    }

    switchRemove(key: string) {
        if (!(this && this.switchPersistenceModule)) {
            return;
        }
        this.switchPersistenceModule.remove(key);
    }

    clusterHandler(setter: { [x: string]: (...args: any) => any }) {
        if (!cluster.isMaster) {
            process.on("message", (data) => {
                if (!data.configManager) {
                    return;
                }
                setter[data.method].apply(this, Array.isArray(data.args) ? data.args : Object.values(data.args));
            });
        }
    }

    configRemove(key: string) {
        if (!(this && this.configPersistenceModule)) {
            return;
        }
        this.configPersistenceModule.remove(key);
    }

    boardcastSetConfig(...args: any[]) {
        this.boardcastSetter("setConfig", args);
    }

    boardcastSetSwitch(...args: any[]) {
        this.boardcastSetter("setSwitch", args);
    };

    boardcastSetter(method: string, args: any[]) {
        const payload = {
            method,
            configManager: true,
            args: [] as any[]
        };
        payload.args = args;
        process.send!(payload);
    }

    getRandom() {
        return random.uniform(1, 100)();
    };

    isSwitchedOn(configKey: string, defaultValue = 0) {
        const wrappedValue = this.__data__.switchMap[configKey];
        const randomValue = this.getRandom();
        if (typeof wrappedValue === "undefined" || typeof wrappedValue.value !== "number") {
            return randomValue <= defaultValue;
        }
        return randomValue <= wrappedValue.value;
    };

    setConfig(configKey: string, configValue: any, comment?: string) {
        const payload = {value: configValue, comment};
        this.setConfigWithoutStore(configKey, configValue, comment);
        this.boardcastSetConfig(configKey, configValue, comment);
        this.configPersistence(Object.assign(payload, {key: configKey}));
        this.configLogger.log(OPERATION_CONSTANTS.SET, {key: configKey, value: configValue, comment});
        return this;
    }

    getConfig(configKey: string, defaultValue: any) {
        const wrappedValue = this.__data__.configMap[configKey];
        if (typeof wrappedValue === "undefined") {
            return defaultValue;
        }
        if (typeof wrappedValue.value === "string") {
            return weakJsonParser(wrappedValue.value);
        }
        return wrappedValue.value;
    }

    removeConfig(configKey: string) {
        if (this.getConfig(configKey, null) === null) {
            return this;
        }
        const {value, comment} = this.getConfig(configKey, null);
        this.configLogger.log(OPERATION_CONSTANTS.DELETE, {key: configKey, value, comment});
        delete this.__data__.configMap[configKey];
        this.configRemove(configKey);
        return this;
    }

    setSwitch(configKey: string, switchValue: number | string, comment?: string) {
        if (!switchValueValidate(switchValue)) {
            return this;
        }
        const payload = {value: parseInt(switchValue as string), comment};
        this.setSwitchWithoutStore(configKey, switchValue, comment);
        this.boardcastSetSwitch(configKey, switchValue, comment);
        this.switchPersistence(Object.assign(payload, {key: configKey}));
        this.switchLogger.log(OPERATION_CONSTANTS.SET, {key: configKey, value: switchValue, comment});
        return this;
    };

    setSwitchWithoutStore(configKey: string, switchValue: string | number, comment?: string) {
        this.__data__.switchMap[configKey] = {value: parseInt(switchValue as string), comment};
    };

    removeSwitch(configKey: string) {
        if (this.getSwitch(configKey) === null) {
            return this;
        }
        const {value, comment} = this.__data__.switchMap[configKey];
        this.switchLogger.log(OPERATION_CONSTANTS.DELETE, {key: configKey, value, comment});
        delete this.__data__.switchMap[configKey];
        this.switchRemove(configKey);
        return this;
    };

    getSwitch(configKey: string, defaultValue?: boolean) {
        if (this.__data__.switchMap.hasOwnProperty(configKey)) {
            return this.__data__.switchMap[configKey];
        }
        return defaultValue || null;
    };

    getJSONConfig(configKey: string, defaultValue?: string) {
        const response = this.getConfig(configKey, defaultValue);
        try {
            if (typeof response === "string") {
                return JSON.parse(response);
            } else {
                return defaultValue;
            }
        } catch (e) {
            console.log(e);
            ErrorCollector.push(__filename, e);
            return defaultValue;
        }
    };

    getConfigMap() {
        return this.__data__.configMap;
    }

    getSwitchMap() {
        return this.__data__.switchMap;
    }

    setConfigPersistenceModule(module: PersistenceStore<Config>) {
        this.configPersistenceModule = module;
        return this;
    };

    setSwitchPersistenceModule(module: PersistenceStore<Switch>) {
        this.switchPersistenceModule = module;
        return this;
    };

    initConfigMap() {
        this.baseMapInitHandler(this.configPersistenceModule!, this.setConfigWithoutStore);
        return this;
    }

    async baseInitProcedure<T extends (Config | Switch)>(module: PersistenceStore<T>, setter: (...args: any[]) => void) {
        const result = await module.getAll();
        result.forEach(el => setter.call(this, el.key, el.value, el.comment));
    }

    async baseMapInitHandler<T extends (Config | Switch)>(module: PersistenceStore<T>, setter: (...args: any[]) => void) {
        if (typeof module !== "undefined") {
            setInterval(async () => {
                await this.baseInitProcedure(module, setter);
            }, 10000);
            await this.baseInitProcedure(module, setter);
        }
    }

    initSwitchMap() {
        this.baseMapInitHandler(this.switchPersistenceModule!, this.setSwitchWithoutStore);
        return this;
    }

    useMySQLStore() {
        this.setConfigPersistenceModule(new configStore.mysql());
        this.setSwitchPersistenceModule(new switchStore.mysql());
        return this;
    }

    useRedisStore() {
        this.setConfigPersistenceModule(new configStore.redis());
        this.setSwitchPersistenceModule(new switchStore.redis());
        return this;
    }

    getArrayConfig(configKey: string, defaultValue?: string) {
        return this.getJSONConfig(configKey, defaultValue);
    };

    getObjectConfig(configKey: string, defaultValue?: string) {
        return this.getJSONConfig(configKey, defaultValue);
    };
}

export const ConfigManager = new SystemConfigManager();
export const configStore = configStoreCollection;
export const switchStore = switchStoreCollection;
