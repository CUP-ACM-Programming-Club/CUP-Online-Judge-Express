import {BaseLogger} from "./base-log";
import {ConfigManager} from "../../config-manager";
const OPERATION_CONSTANTS = require("../../constants/operation");


export default function (Model: any) {
	return function (Methods: any) {
		class ConfigLogger extends BaseLogger {
			configManager: ConfigManager | undefined;
			constructor(configManager?: ConfigManager) {
				super();
				if (null !== configManager) {
					this.configManager = configManager;
				}
			}

			setManager(manager: ConfigManager) {
				this.configManager = manager;
			}

			async log(operation: any, payload: any) {
				await Model.create(Object.assign(payload, {operation}));
			}

			async restore(id: string) {
				const result = await Model.findByPk(id);
				if (null === result) {
					return;
				}
				const log = result.get();
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
			}
		}

		return new ConfigLogger();
	};
};
