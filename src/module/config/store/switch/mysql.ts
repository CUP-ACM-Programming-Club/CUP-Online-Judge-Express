import {Switch} from "../../../../orm/ts-model";
import mysqlFactory from "../base/mysql";
Switch.sync();
export const mysqlInstance = mysqlFactory(Switch);
