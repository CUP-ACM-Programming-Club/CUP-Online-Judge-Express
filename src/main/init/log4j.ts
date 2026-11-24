import log4js, {Logger} from "log4js"

log4js.configure({
    appenders: {
        app: {type: 'dateFile', filename: './log/log4j-log.log', pattern: `${global.currentDaemonName || "default"}-yyyy-MM-dd.log`, alwaysIncludePattern: true},
        console: {type: "console"}
    },
    categories: {
        default: {
            appenders: ["app", "console"], level: "INFO"
        }
    }
});
const logger = log4js.getLogger("default");
export default logger as Logger

