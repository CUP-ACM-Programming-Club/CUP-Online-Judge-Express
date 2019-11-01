const sequelize = require("../../../orm/instance/sequelize");
const SwitchLog = sequelize.import("switch_log", require("../../../orm/models/switch_log"));
const LoggerFactory = require("./base/logger-factory");
SwitchLog.sync();

module.exports = LoggerFactory(SwitchLog);
