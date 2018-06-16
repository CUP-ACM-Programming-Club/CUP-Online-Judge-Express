const express = require("express");
const dayjs = require("dayjs");
const md = require("markdown-it")({
	html: true,
	breaks: true
});

const mh = require("markdown-it-highlightjs");
const mk = require("markdown-it-katex");
md.use(mk);
md.use(mh);
const cache_query = require("../module/mysql_cache");
const const_variable = require("../module/const_name");
const [error] = require("../module/const_var");
const auth = require("../middleware/auth");
const cheerio = require("cheerio");
const path = require("path");
const query = require("../module/mysql_query");
const router = express.Router();
const check = async (req, cid) => {
	const contest = await cache_query("SELECT * FROM contest WHERE contest_id = ?", [cid]);
	return contest[0].private !== 1 || (req.session.isadmin || req.session.contest[`c${cid}`] || req.session.contest_maker[`m${cid}`]);
};

router.get("/general/:cid", async (req, res) => {
	let cid = req.params.cid === undefined || isNaN(req.params.cid) ? -1 : parseInt(req.params.cid);
	if (~cid && check(req, cid)) {
		const contest_general_detail = await cache_query(`select t1.*,t2.total_problem from (select * from contest where contest_id = 1099)t1
  left join (select count(1)total_problem,contest_id from contest_problem where contest_id = 1099)t2
  on t1.contest_id = t2.contest_id`, [cid, cid]);
		if (contest_general_detail.length < 1) {
			res.json(error.invalidParams);
		}
		else {
			res.json({
				status: "OK",
				data: contest_general_detail[0]
			});
		}
	}
	else {
		res.json(error.noprivilege);
	}
});

router.get("/problem/:cid",async (req, res) => {
	let cid = req.params.cid === undefined || isNaN(req.params.cid) ? -1 : parseInt(req.params.cid);
	if (~cid && check(req, cid)) {
		//const contest_general_detail =
		if (contest_general_detail.length < 1) {
			res.json(error.invalidParams);
		}
		else {
			res.json({
				status: "OK",
				data: contest_general_detail[0]
			});
		}
	}
	else {
		res.json(error.noprivilege);
	}
});

router.get("/statistics/:cid", (req, res) => {

});

router.post("/password/:cid", async (req, res) => {
	let cid = req.params.cid === undefined || isNaN(req.params.cid) ? -1 : parseInt(req.params.cid);
	if (~cid) {
		const contest_detail = await cache_query("select * from contest where contest_id = ?", [cid]);
		if (contest_detail.length < 1) {
			res.json(error.invalidParams);
		}
		else {
			const password = contest_detail[0].password;
			const user_password = req.body.password;
			if (password.toString() === user_password.toString()) {
				req.session.contest[`c${cid}`] = true;
				res.json({
					status: "OK"
				});
			}
			else {
				res.json({
					status: "Wrong password"
				});
			}
		}
	}
	else {
		res.json(error.noprivilege);
	}
});

module.exports = ["/contest", auth, router];
