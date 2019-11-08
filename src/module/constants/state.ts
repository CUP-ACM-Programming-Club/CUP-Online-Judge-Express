const error: any = {};
const ok: any = {};
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

error.problemInContest = {
	status:"error",
	statement:"Current problem is in contest."
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

error.solutionIdNotValid = {
	status:"error",
	statement:"Solution ID is not valid or result of it is not accept"
};

error.contestMode = {
	status:"error",
	contest_mode:true
};

error.invalidProblemID = {
	status: "error",
	statement: "Problem ID is invalid"
};

error.internalError = {
	status: "error",
	statement: "Server Internal error"
};

error.unavailable = {
	status: "error",
	statement: "According to setting, current service is unavailable",
	rule: -1
};

error.errorMaker = function(statement: string) {
	return {
		status: "error",
		statement
	};
};

error.base = {
	status: "error"
};

error.attributeMaker = function(source: object) {
	let target = Object.assign({}, error.base);
	return Object.assign(target, source);
};

ok.logined = {
	status: "OK",
	statment: "logined"
};
ok.ok = {
	status: "OK"
};

ok.serverReceived = {
	status:"OK",
	statement:"server has receive your post"
};

ok.okMaker = function(data: any) {
	return {
		status: "OK",
		data
	};
};

module.exports = {error, ok};
