let error = {};
let ok = {};
error.database = {
	status: "error",
	statement: "database error"
};
error.parseJSON = {
	status: "error",
	statement: "invalid JSON string"
};
error.tokenNoMatch = {
	status: "error",
	statement: "token doesn't match"
};
error.passNoMatch = {
	status: "error",
	statement: "password doesn't match"
};
error.invalidToken = {
	status: "error",
	statement: "invalid token"
};

error.invalidUser = {
	status: "error",
	statement: "invalid user"
};

error.invalidParams = {
	status: "error",
	statememt: "invalid params"
};

error.memcahceError = {
	status: "error",
	statememt: "memcache error"
};

error.nologin = {
	status: "error",
	statement: "not login"
};

error.invalidCaptcha = {
	status: "error",
	statement: "captcha doesn't match"
};

error.invalidJSON = {
	status: "error",
	statement: "invalid JSON format"
};

error.contestNotStart = {
	status: "error",
	statement: "contest not start!",
	error_code: 101
};

error.noprivilege = {
	status: "error",
	statement: "Permission denied"
};

ok.logined = {
	status: "OK",
	statment: "logined"
};
ok.ok = {
	status: "OK"
};
module.exports = [error, ok];
