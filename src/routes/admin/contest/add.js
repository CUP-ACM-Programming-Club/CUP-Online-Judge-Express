const query = require("../../../module/mysql_query");
const [error, ok] = require("../../../module/const_var");
const express = require("express"), router = express.Router();
const {trimProperty, removeAllCompetitorPrivilege, removeAllContestProblem, addContestCompetitor, addContestProblem} = require("../../../module/util");
const dayjs = require("dayjs");

function timeToString(time) {
	return dayjs(time).format("YYYY-MM-DD HH:mm:ss");
}

router.post("/", async (req, res) => {
	try {
		let {ContestMode, Public, classroomSelected, title, contest_id, defunct, description, hostname, langmask} = trimProperty(req.body);
		let {startTime, endTime, password, problemSelected, userList} = trimProperty(req.body);
		startTime = timeToString(startTime);
		endTime = timeToString(endTime);
		if (defunct) {
			defunct = "Y";
		} else {
			defunct = "N";
		}
		if (hostname.length === 0) {
			hostname = "null";
		}
		let sql = `insert into contest(title, start_time, end_time, private, langmask, description, password, vjudge,
    ip_policy, cmod_visible, limit_hostname,defunct) values(?,?,?,?,?,?,?,?,?,?,?,?)`;
		await query(sql, [title, startTime, endTime, Public, langmask, description, password, 0, classroomSelected, ContestMode,
			hostname, defunct]);
		await removeAllContestProblem(contest_id);
		await addContestProblem(contest_id, problemSelected);
		await removeAllCompetitorPrivilege(contest_id);
		await addContestCompetitor(contest_id, userList);
		res.json(ok.ok);
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

module.exports = ["/add", router];
