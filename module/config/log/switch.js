const sequelize = require("../../../orm/instance/sequelize");
const SwitchLog = sequelize.import("switch_log", require("../../../orm/instance/sequelize"));
const LoggerFactory = require("./base/logger-factory");
SwitchLog.sync();

module.exports = LoggerFactory(SwitchLog);
