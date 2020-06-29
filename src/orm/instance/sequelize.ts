import {Sequelize} from "sequelize-typescript";
import * as Models from "../ts-model"
const mysqlConfig = global.config.mysql;
const sequelize = new Sequelize("jol", mysqlConfig.user, mysqlConfig.password, {
	host: mysqlConfig.host,
	dialect: "mysql",
	timezone: "+08:00"
});
sequelize.addModels([process.cwd() + "/dist/orm/ts-model/**/*.ts"])
sequelize.addModels(Object.values(Models));
export = sequelize;
