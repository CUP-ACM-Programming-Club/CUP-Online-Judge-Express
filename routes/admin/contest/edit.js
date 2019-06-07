const isNumber = require("../../../module/util/isNumber");
const query = require("../../../module/mysql_query");
const [error, ok] = require("../../../module/const_var");
const router = require("../../../module/admin/baseGetter")("contest", "contest_id");

function trimProperty(target) {
	for (let property in target) {
		if (target.hasOwnProperty(property) && typeof target[property] === "string") {
			target[property] = target[property].trim();
		}
	}
	return target;
}

router.post("/", async (req, res) => {
	res.json(error.errorMaker("developing"));
	let {title, password, description, privilege, contestMode, access, classroom} = trimProperty(req.body);
	if (access.length === 0) {
		access = "null";
	}
	let sql = `update contest set title = ?,description = ?, start_time = ?, end_time = ?, private = ?, langmask = ?,
	limit_hostname = ?, password = ?, vjudge = 0, cmod_visible = ?, ip_policy = ? where contest_id = ?`;
	// TODO
});

router.get("/user/:id", async (req, res) => {
	try {
		let contest_id = req.params.id;
		if (!isNumber(contest_id)) {
			res.json(error.invalidParams);
			return;
		}
		const data = await query("select user_id from privilege where rightstr = ?", [`c${contest_id}`]);
		res.json(ok.okMaker(data));
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

module.exports = ["/edit", router];