import {server} from "../../../init/http-server";
import sequelize from "../../../../orm/instance/sequelize";
const mysql = require("../../../mysql_query");
const redis = require("../../../redis").default;

module.exports = function () {
	console.log(`Worker PID: ${process.pid} close:`);
	server.close();
	console.log("HTTP server is closed");
	sequelize.close();
	console.log("Sequelize instance is closed");
	mysql.pool.end();
	console.log("MySQL is closed");
	redis.quit();
	console.log("Redis is closed");
	setTimeout(() => {
		console.log(`Worker PID: ${process.pid} execute process.exit(0)`);
		process.exit(0);
	}, 5000);
};
