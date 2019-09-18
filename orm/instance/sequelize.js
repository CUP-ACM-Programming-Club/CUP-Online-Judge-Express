const Sequelize = require("sequelize");

const sequelize = new Sequelize("jol", "eleme", "eleme", {
	host: "localhost",
	dialect: "mysql",
	timezone: "+08:00"
});

module.exports = sequelize;
