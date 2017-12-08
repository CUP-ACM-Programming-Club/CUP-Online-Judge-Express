const log4js = require("log4js");
const path = require('path');
const logger4js = log4js.getLogger('console');  //配置成console，会把所有的控制台打印包括 console.log()都记录到log文件中
log4js.configure({
    appenders: {
        console: {type: 'console'},
        file: {type: 'file', filename: 'logs/site.log'}
    },
    categories: {
        cheese: {appenders: ['file'], level: 'info'},
        default: {appenders: ['console'], level: 'info'}
    }
});
exports.logger = function (category, level) {
    const logger = log4js.getLogger(category);
    logger.level = level;
    return logger;
};
exports.connectLogger = function (logger, options) {
    return log4js.connectLogger(logger, options);
};