const sequelize = require("../../../../orm/instance/sequelize");
const Switch = sequelize.import("switch", require("../../../../orm/models/switch"));
Switch.sync();
import mysqlFactory from "../base/mysql";
export default mysqlFactory(Switch);
