import LoggerFactory from "./base/logger-factory";
import {switchLog as SwitchLog} from "../../../orm/ts-model";
SwitchLog.sync();

export default LoggerFactory(SwitchLog);
