import {server} from "../../init/http-server";
import sequelize from "../../../infrastructure/orm/instance/sequelize";
import {MySQLManager} from "../../../infrastructure/db/mysql/MySQLManager";
const redis = require("../../../infrastructure/redis/redis").default;

module.exports = function () {
	console.log(`Worker PID: ${process.pid} close:`);
	server.close();
	console.log("HTTP server is closed");
	sequelize.close();
	console.log("Sequelize instance is closed");
	// 与原 legacy/mysql_query 外壳给 pool.end 打的补丁一致：连接池已关闭时不再重复 end
	const pool = MySQLManager.mysqlPool as typeof MySQLManager.mysqlPool & {_closed?: boolean};
	if (!pool._closed) {
		pool.end();
	}
	console.log("MySQL is closed");
	redis.quit();
	console.log("Redis is closed");
	setTimeout(() => {
		console.log(`Worker PID: ${process.pid} execute process.exit(0)`);
		process.exit(0);
	}, 5000);
};
