const sequelize = require("../../../orm/instance/sequelize");
const SwitchLog = sequelize.import("switch_log", require("../../../orm/models/switch_log"));
import LoggerFactory from "./base/logger-factory";
SwitchLog.sync();

export default LoggerFactory(SwitchLog);
