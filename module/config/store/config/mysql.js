const sequelize = require("../../../../orm/instance/sequelize");
const Config = sequelize.import("config", require("../../../../orm/models/config"));
Config.sync();
const mysqlFactory = require("../base/mysql");

module.exports = mysqlFactory(Config);
