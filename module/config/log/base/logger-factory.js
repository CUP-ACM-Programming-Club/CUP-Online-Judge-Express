const inheritPrototype = require("../../../util/InheritPrototype");
const BaseLogger = require("./base-log");
const OPERATION_CONSTANTS = require("../../constants/operation");

module.exports = function (Model) {
	return function (Methods) {
		function ConfigLogger(configManager) {
			if (null !== configManager) {
				this.configManager = configManager;
			}
		}

		inheritPrototype(ConfigLogger, BaseLogger);

		ConfigLogger.prototype.setManager = function (manager) {
			this.configManager = manager;
		};

		ConfigLogger.prototype.log = async function (operation, payload) {
			await Model.create(Object.assign(payload, {operation}));
		};

		ConfigLogger.prototype.restore = async function (id) {
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
		};

		return new ConfigLogger();
	};
};
