import {Sequelize} from "sequelize-typescript";
import * as Models from "../ts-model"
import Logger from "../../module/console/Logger";
const mysqlConfig = global.config.mysql;
const sequelize = new Sequelize("jol", mysqlConfig.user, mysqlConfig.password, {
	host: mysqlConfig.host,
	dialect: "mysql",
	timezone: "+08:00",
	retry  : {
		match: [
			/ETIMEDOUT/,
			/EHOSTUNREACH/,
			/ECONNRESET/,
			/ECONNREFUSED/,
			/ETIMEDOUT/,
			/ESOCKETTIMEDOUT/,
			/EHOSTUNREACH/,
			/EPIPE/,
			/EAI_AGAIN/,
			/SequelizeConnectionError/,
			/SequelizeConnectionRefusedError/,
			/SequelizeHostNotFoundError/,
			/SequelizeHostNotReachableError/,
			/SequelizeInvalidConnectionError/,
			/SequelizeConnectionTimedOutError/
		],
		max  : 5,
	},
	dialectOptions: {
		connectTimeout: 20000, // default is 10s which causes occasional ETIMEDOUT errors (see https://stackoverflow.com/a/52465919/491553)
	}
});
Logger.log(`add sequelize module`);
sequelize.addModels([process.cwd() + "/dist/orm/ts-model/**/*.ts"])
sequelize.addModels(Object.values(Models));
export = sequelize;
