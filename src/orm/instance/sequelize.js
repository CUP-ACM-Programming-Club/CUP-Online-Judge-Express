const Sequelize = require("sequelize");
const mysqlConfig = global.config.mysql;
const sequelize = new Sequelize("jol", mysqlConfig.user, mysqlConfig.password, {
	host: mysqlConfig.host,
	dialect: "mysql",
	timezone: "+08:00"
});

module.exports = sequelize;
