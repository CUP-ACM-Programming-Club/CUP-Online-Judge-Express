const isNumber = require("../../../module/util/isNumber");
const query = require("../../../module/mysql_query");
const [error, ok] = require("../../../module/const_var");
const dayjs = require("dayjs");
const router = require("../../../module/admin/baseGetter")("contest", "contest_id");
const {trimProperty, removeAllConpetitorPrivilege, removeAllContestProblem, addContestConpetitor,addContestProblem} = require("../../../module/util");

function timeToString(time) {
	return dayjs(time).format("YYYY-MM-DD HH:mm:ss");
}

router.post("/", async (req, res) => {
	try {
		let {ContestMode, Public, classroomSelected, title, contest_id, defunct, description, hostname, langmask} = trimProperty(req.body);
		let {startTime, endTime, password, problemSelected, userList} = trimProperty(req.body);
		startTime = timeToString(startTime);
		endTime = timeToString(endTime);
		if (hostname.length === 0) {
			hostname = "";
		}
		if (defunct) {
			defunct = "Y";
		} else {
			defunct = "N";
		}
		let sql = `update contest set title = ?,description = ?, start_time = ?, end_time = ?, private = ?, langmask = ?,
	limit_hostname = ?, password = ?, vjudge = 0, cmod_visible = ?, ip_policy = ?, defunct = ? where contest_id = ?`;
		await query(sql, [title, description, startTime, endTime, Public, langmask, hostname, password, ContestMode, classroomSelected,
			defunct, contest_id]);
		await removeAllContestProblem(contest_id);
		await addContestProblem(contest_id, problemSelected);
		await removeAllConpetitorPrivilege(contest_id);
		await addContestConpetitor(contest_id, userList);
		res.json(ok.ok);
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
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