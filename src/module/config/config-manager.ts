import dayjs from "dayjs";
import cluster from "cluster";
import { PersistenceStore } from "./store/base/store";
import { config as Config, Switch } from "../../orm/ts-model";
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
    return { modify_time: dayjs().format("YYYY-MM-DD HH:mm:ss") };
}

interface DataStoragePayload {
    [key: string]: {
        value: any,
        comment?: string
    }
}

interface DataStorage {
    configMap: DataStoragePayload,
    switchMap: DataStoragePayload
}

export interface IConfigManagerOptions {
    setConfig: (key: string, value: any, comment?: string) => void;
    removeConfig: (key: string) => void;
}

export interface ISwitchManagerOptions {
    setSwitch: (key: string, value: number, comment?: string) => void;
    removeSwitch: (key: string) => void;
}

export class SystemConfigManager {
    SWITCH_ON = 100;
    SWITCH_OFF = 0;
    private data: DataStorage;
    configLogger!: any;
    switchLogger!: any;
    switchPersistenceModule?: PersistenceStore<Switch>;
    configPersistenceModule?: PersistenceStore<Config>;

    constructor() {
        this.data = {
            switchMap: {},
            configMap: {}
        };
        // Backward compatibility for __data__ access if needed (though we should avoid it)
        // Leaving it out to enforce cleaner access, or add a getter if necessary.

        this.configLogger = ConfigLoggerFactory({ set: this.setConfig.bind(this), remove: this.removeConfig.bind(this) });
        this.switchLogger = SwitchLoggerFactory({ set: this.setSwitch.bind(this), remove: this.removeSwitch.bind(this) });
        this.clusterHandler({ "setConfig": this.setConfigWithoutStore.bind(this), "setSwitch": this.setSwitchWithoutStore.bind(this) });
    }

    /**
     * Legacy accessor if external modules access __data__ directly.
     * Deprecated: Use getConfigMap/getSwitchMap instead.
     */
    get __data__() {
        return {
            __switchMap__: this.data.switchMap,
            __configMap__: this.data.configMap,
            switchMap: this.data.switchMap,
            configMap: this.data.configMap
        };
    }

    setConfigWithoutStore(configKey: string, configValue: any, comment?: string) {
        this.data.configMap[configKey] = { value: configValue, comment };
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
            process.on("message", (data: any) => {
                if (!data || !data.configManager) {
                    return;
                }
                if (typeof setter[data.method] === "function") {
                    setter[data.method].apply(this, Array.isArray(data.args) ? data.args : Object.values(data.args));
                }
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
            args: args
        };
        if (process.send) {
            process.send(payload);
        }
    }

    getRandom() {
        return random.uniform(1, 100)();
    };

    isSwitchedOn(configKey: string, defaultValue = 0) {
        const wrappedValue = this.data.switchMap[configKey];

        // Optimize: If default is 0 or 100, we might not need random
        // But here we check wrappedValue

        if (typeof wrappedValue === "undefined" || typeof wrappedValue.value !== "number") {
            // Fallback to defaultValue check
            if (defaultValue <= 0) return false;
            if (defaultValue >= 100) return true;
            // Only generate random if needed
            return this.getRandom() <= defaultValue;
        }

        const val = wrappedValue.value;
        if (val <= 0) return false;
        if (val >= 100) return true;

        return this.getRandom() <= val;
    };

    setConfig(configKey: string, configValue: any, comment?: string) {
        const payload = { value: configValue, comment };
        this.setConfigWithoutStore(configKey, configValue, comment);
        this.boardcastSetConfig(configKey, configValue, comment);
        this.configPersistence(Object.assign(payload, { key: configKey }));
        this.configLogger.log(OPERATION_CONSTANTS.SET, { key: configKey, value: configValue, comment });
        return this;
    }

    getConfig(configKey: string, defaultValue: any) {
        const wrappedValue = this.data.configMap[configKey];
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
        const { value, comment } = this.getConfig(configKey, null);
        this.configLogger.log(OPERATION_CONSTANTS.DELETE, { key: configKey, value, comment });
        delete this.data.configMap[configKey];
        this.configRemove(configKey);
        return this;
    }

    setSwitch(configKey: string, switchValue: number | string, comment?: string) {
        if (!switchValueValidate(switchValue)) {
            return this;
        }
        const parsedValue = parseInt(switchValue as string);
        const payload = { value: parsedValue, comment };
        this.setSwitchWithoutStore(configKey, parsedValue, comment);
        this.boardcastSetSwitch(configKey, parsedValue, comment);
        this.switchPersistence(Object.assign(payload, { key: configKey }));
        this.switchLogger.log(OPERATION_CONSTANTS.SET, { key: configKey, value: parsedValue, comment });
        return this;
    };

    setSwitchWithoutStore(configKey: string, switchValue: string | number, comment?: string) {
        this.data.switchMap[configKey] = { value: parseInt(switchValue as string), comment };
    };

    removeSwitch(configKey: string) {
        if (this.getSwitch(configKey) === null) {
            return this;
        }
        const { value, comment } = this.data.switchMap[configKey];
        this.switchLogger.log(OPERATION_CONSTANTS.DELETE, { key: configKey, value, comment });
        delete this.data.switchMap[configKey];
        this.switchRemove(configKey);
        return this;
    };

    getSwitch(configKey: string, defaultValue?: boolean) {
        if (this.data.switchMap.hasOwnProperty(configKey)) {
            return this.data.switchMap[configKey];
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
        return this.data.configMap;
    }

    getSwitchMap() {
        return this.data.switchMap;
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
        this.baseMapInitHandler(this.configPersistenceModule!, this.setConfigWithoutStore.bind(this));
        return this;
    }

    async baseInitProcedure<T extends (Config | Switch)>(module: PersistenceStore<T>, setter: (...args: any[]) => void) {
        try {
            const result = await module.getAll();
            result.forEach(el => setter.call(this, el.key, el.value, el.comment));
        } catch (e) {
            console.error("ConfigManager init error:", e);
        }
    }

    async baseMapInitHandler<T extends (Config | Switch)>(module: PersistenceStore<T>, setter: (...args: any[]) => void) {
        if (typeof module !== "undefined") {
            const loop = async () => {
                await this.baseInitProcedure(module, setter);
                // Recursive setTimeout to avoid overlap and potential pile-up
                setTimeout(loop, 10000);
            };
            await loop();
        }
    }

    initSwitchMap() {
        this.baseMapInitHandler(this.switchPersistenceModule!, this.setSwitchWithoutStore.bind(this));
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
