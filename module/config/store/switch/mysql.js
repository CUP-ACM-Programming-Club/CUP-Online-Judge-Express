const sequelize = require("../../../../orm/instance/sequelize");
const Switch = sequelize.import("switch", require("../../../../orm/models/switch"));
Switch.sync();
const mysqlFactory = require("../base/mysql");

module.exports = mysqlFactory(Switch);
