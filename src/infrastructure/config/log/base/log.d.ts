import {SystemConfigManager} from "../../config-manager";
import {LOG_OPERATION} from "../../constants/operation";

export interface Logger {
    configManager?: SystemConfigManager,
    setManager: (manager: SystemConfigManager) => void;
    log: (operation: LOG_OPERATION, payload: any) => Promise<void>;
    restore: (id: number) => Promise<void>;
}

export interface OperationSetter {
    set: (key: string, value: any, comment?: string) => void,
    remove: (key: string, value: any, comment?: string) => void
}
