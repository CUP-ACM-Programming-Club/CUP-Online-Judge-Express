import {Logger, OperationSetter} from "./log";
import {SystemConfigManager} from "../../config-manager";
import {LOG_OPERATION} from "../../constants/operation";
import {Model, ModelCtor} from "sequelize-typescript";
import {configLog, switchLog} from "../../../../orm/ts-model";
const OPERATION_CONSTANTS = require("../../constants/operation");

export default function <T extends Model>(model: ModelCtor<T>) {
    return function (Methods: OperationSetter) {
        const ConfigLogger = function (this: Logger, configManager?: SystemConfigManager) {
            if (null !== configManager) {
                this.configManager = configManager;
            }
        } as any as { new(configManager?: SystemConfigManager): Logger };

        ConfigLogger.prototype.setManager = function (manager: SystemConfigManager) {
            this.configManager = manager;
        };

        ConfigLogger.prototype.log = async function (operation: LOG_OPERATION, payload: any) {
            await model.create(Object.assign(payload, {operation}));
        };

        ConfigLogger.prototype.restore = async function (id: number | string) {
            const result = await model.findByPk(id);
            if (null === result) {
                return;
            }
            const log = result.get() as (configLog | switchLog);
            switch (log.operation) {
                case OPERATION_CONSTANTS.SET:
                    Methods.set.call(this.configManager, log.key, log.value, log.comment);
                    break;
                case OPERATION_CONSTANTS.DELETE:
                    Methods.remove.call(this.configManager, log.key, log.value, log.comment);
                    break;
                default:
                    break;
            }
        };

        return new ConfigLogger() as Logger;
    };
};
