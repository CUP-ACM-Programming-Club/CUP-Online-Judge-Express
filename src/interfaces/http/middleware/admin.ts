import policyMiddleware = require("./policy");

// 管理员门禁：实现见 src/policy（requireAdmin），不满足返回 error.noprivilege
export = policyMiddleware.requireAdmin;
