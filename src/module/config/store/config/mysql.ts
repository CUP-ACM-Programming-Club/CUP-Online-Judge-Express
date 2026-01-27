console.log("HELLO FROM MYSQL TS");
import { config as Config } from "../../../../orm/ts-model";
import mysqlFactory from "../base/mysql";

export const mysqlInstance = mysqlFactory(Config);
