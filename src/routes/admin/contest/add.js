import ProblemSetCachePool from "../../../module/problemset/ProblemSetCachePool";
import ContestCachePool from "../../../module/contest/ContestCachePool";
const query = require("../../../module/mysql_query");
import {error, ok} from "../../../module/constants/state";
const express = require("express"), router = express.Router();
const {trimProperty, removeAllCompetitorPrivilege, removeAllContestProblem, addContestCompetitor, addContestProblem} = require("../../../module/util");
const dayjs = require("dayjs");

function timeToString(time) {
	return dayjs(time).format("YYYY-MM-DD HH:mm:ss");
}

router.post("/", async (req, res) => {
	try {
		// TODO: Error Handle
		let {ContestMode, Public, classroomSelected, title, contest_id, defunct, description, hostname, langmask} = trimProperty(req.body);
		let {startTime, endTime, password, problemSelected, userList} = trimProperty(req.body);
		if (typeof problemSelected !== "string" || (typeof problemSelected === "string" && problemSelected.trim().length === 0)) {
			res.json(error.database);
			return;
		}
		startTime = timeToString(startTime);
		endTime = timeToString(endTime);
		if (hostname.length === 0 || hostname === "null") {
			hostname = "";
		}
		if (defunct) {
			defunct = "Y";
		} else {
			defunct = "N";
		}
		let sql = `insert into contest(title, start_time, end_time, private, langmask, description, password, vjudge,
    ip_policy, cmod_visible, limit_hostname,defunct,maker) values(?,?,?,?,?,?,?,?,?,?,?,?,?)`;
		const response = await query(sql, [title, startTime, endTime, Public ? "0" : "1", langmask, description, password, 0, classroomSelected, ContestMode,
			hostname, defunct, req.session.user_id]);
		contest_id = response.insertId;
		await removeAllContestProblem(contest_id);
		await addContestProblem(contest_id, problemSelected);
		await removeAllCompetitorPrivilege(contest_id);
		await addContestCompetitor(contest_id, userList);
		ProblemSetCachePool.removeAll();
		ContestCachePool.removeAll();
		res.json(ok.ok);
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

module.exports = ["/add", router];
