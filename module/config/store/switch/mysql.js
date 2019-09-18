const sequelize = require("../../../../orm/instance/sequelize");
const Switch = sequelize.import("switch", require("../../../../orm/models/switch"));
const mysqlFactory = require("../base/mysql");

module.exports = mysqlFactory(Switch);
