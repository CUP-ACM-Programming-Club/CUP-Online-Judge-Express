import LoggerFactory from "./base/logger-factory";
import {configLog as ConfigLog} from "../../../orm/ts-model";
ConfigLog.sync();
export default LoggerFactory(ConfigLog);
