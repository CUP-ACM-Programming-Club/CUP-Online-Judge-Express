const sequelize = require("../../../../orm/instance/sequelize");
const Config = sequelize.import("config", require("../../../../orm/models/config"));
Config.sync();
import mysqlFactory from "../base/mysql";
export default mysqlFactory(Config);
