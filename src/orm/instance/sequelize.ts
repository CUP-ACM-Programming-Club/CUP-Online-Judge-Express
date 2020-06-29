import {Sequelize} from "sequelize-typescript";
const mysqlConfig = global.config.mysql;
const sequelize = new Sequelize("jol", mysqlConfig.user, mysqlConfig.password, {
	host: mysqlConfig.host,
	dialect: "mysql",
	timezone: "+08:00"
});
sequelize.addModels([process.cwd() + "/dist/orm/ts-model/**/*.ts"])

export = sequelize;
