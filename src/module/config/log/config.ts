const sequelize = require("../../../orm/instance/sequelize");
import LoggerFactory from "./base/logger-factory";
const ConfigLog = sequelize.import("config_log", require("../../../orm/models/config_log"));
ConfigLog.sync();
export default LoggerFactory(ConfigLog);
