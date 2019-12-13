const {server} = require("../../../init/http-server");
const sequelize = require("../../../../orm/instance/sequelize");
const mysql = require("../../../mysql_query");
const redis = require("../../../redis");

module.exports = function () {
	console.log(`Worker PID: ${process.pid} close:`);
	server.close();
	console.log("HTTP server is closed");
	sequelize.close();
	console.log("Sequelize instance is closed");
	mysql.end();
	console.log("MySQL is closed");
	redis.quit();
	console.log("Redis is closed");
	setTimeout(() => {
		console.log(`Worker PID: ${process.pid} execute process.exit(0)`);
		process.exit(0);
	}, 5000);
};
