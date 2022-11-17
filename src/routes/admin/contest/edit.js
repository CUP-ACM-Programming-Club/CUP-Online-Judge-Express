import ContestAssistantManager from "../../../manager/contest/ContestAssistantManager";
import {MySQLManager} from "../../../manager/mysql/MySQLManager";
import {
	addContestCompetitorWithTransaction,
	addContestProblemWithTransaction,
	removeAllCompetitorPrivilegeWithTransaction,
	removeAllContestProblemWithTransaction
} from "../../../module/util";

const isNumber = require("../../../module/util/isNumber").default;
const query = require("../../../module/mysql_query");
const [error, ok] = require("../../../module/const_var");
const dayjs = require("dayjs");
const ProblemSetCachePool = require("../../../module/problemset/ProblemSetCachePool");
const ContestCachePool = require("../../../module/contest/ContestCachePool");

async function privilegeMiddleware (req, res, next) {
	if (req.session.isadmin || req.session.contest_manager) {
		return next();
	}
	const method = req.method;
	const contestId = method.toLowerCase() === "get" ? req.params.id : req.body.contest_id;
	const result = await ContestAssistantManager.userIsContestAssistant(contestId, req.session.user_id);
	if (result) {
		return next();
	}
	else {
		res.json(error.noprivilege);
	}
}
const router = require("../../../module/admin/baseGetter")("contest", "contest_id", [privilegeMiddleware]);
const {trimProperty} = require("../../../module/util");

function timeToString(time) {
	return dayjs(time).format("YYYY-MM-DD HH:mm:ss");
}

router.post("/", privilegeMiddleware, async (req, res) => {
	const rawConnection = await MySQLManager.getConnection();
	const connection = rawConnection.promise();
	try {
		await connection.beginTransaction();
		let {ContestMode, Public, classroomSelected, title, contest_id, defunct, description, hostname, langmask} = trimProperty(req.body);
		let {startTime, endTime, password, problemSelected, userList, showAllRanklist, showSim} = trimProperty(req.body);
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
		let sql = `update contest set title = ?,description = ?, start_time = ?, end_time = ?, private = ?, langmask = ?,
	limit_hostname = ?, password = ?, vjudge = 0, cmod_visible = ?, ip_policy = ?, defunct = ?,
	 show_all_ranklist = ?, show_sim = ? where contest_id = ?`;
		await connection.query(sql, [title, description, startTime, endTime, Public ? "0" : "1", langmask, hostname, password, ContestMode, classroomSelected,
			defunct, showAllRanklist, showSim, contest_id]);
		await removeAllContestProblemWithTransaction(connection, contest_id).then(() => console.log("removeAllContestFinished", contest_id));
		await addContestProblemWithTransaction(connection, contest_id, problemSelected).then(() => console.log("addContestProblemFinished", contest_id, problemSelected));
		await removeAllCompetitorPrivilegeWithTransaction(connection, contest_id).then(() => console.log("removeAllConpetitorPrivilegeFinished", contest_id));
		await addContestCompetitorWithTransaction(connection, contest_id, userList).then(() => console.log("addContestConpetitorFinished", contest_id, userList));
		await connection.commit();
		ProblemSetCachePool.removeAll();
		ContestCachePool.removeAll();
		res.json(ok.ok);
	} catch (e) {
		console.log(e);
		res.json(error.database);
		connection.rollback((err) => {
			console.log("error: ", err);
		});
	} finally {
		connection.release();
	}
});

router.get("/user/:id", privilegeMiddleware, async (req, res) => {
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
