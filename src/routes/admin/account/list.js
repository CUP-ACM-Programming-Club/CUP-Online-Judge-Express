module.exports = require("../../../module/admin/list")("users", {
	where:"where school = 'your_own_school'",
	order:"order by reg_time desc"
});