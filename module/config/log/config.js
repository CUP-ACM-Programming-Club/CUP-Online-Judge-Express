const sequelize = require("../../../orm/instance/sequelize");
const LoggerFactory = require("./base/logger-factory");
const ConfigLog = sequelize.import("config_log", require("../../../orm/models/config_log"));
ConfigLog.sync();

module.exports = LoggerFactory(ConfigLog);
