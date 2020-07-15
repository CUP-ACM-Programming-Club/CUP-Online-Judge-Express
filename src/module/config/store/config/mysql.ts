import {config as Config} from "../../../../orm/ts-model";
import mysqlFactory from "../base/mysql";
Config.sync();
export const mysqlInstance = mysqlFactory(Config);
