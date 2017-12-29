const express = require("express");
const NodeCache = require("node-cache");
const router = express.Router();
const query = require("../module/mysql_query");
const cache = new NodeCache({stdTTL: 10, checkperiod: 15});
Date.prototype.Format = function (fmt) { //author: meizz
	const o = {
		"M+": this.getMonth() + 1, //月份
		"d+": this.getDate(), //日
		"h+": this.getHours(), //小时
		"m+": this.getMinutes(), //分
		"s+": this.getSeconds(), //秒
		"q+": Math.floor((this.getMonth() + 3) / 3), //季度
		"S": this.getMilliseconds() //毫秒
	};
	if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
	for (let k in o)
		if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
	return fmt;
};

const rank_search = async (req, res, next, start, end) => {
	if (start > end) {
		start ^= end;
		end ^= start;
		start ^= end;
	}
	const step = end - start;
	const _detail = cache.get(`rank from ${start} to ${end}`);
	// console.log("here");
	if (_detail === undefined) {
		//console.log("not cache");
		let result = await query(`SELECT * FROM users 
            ORDER BY solved DESC,submit,reg_time LIMIT ${start},${step + 1}`);
		let send_msg = {
			cache_time: (new Date()).Format("yyyy-MM-dd hh:mm:ss"),
			start: start,
			end: end,
			user: []
		};
		for (let i in result) {
			let admin = await query("select count(1) as count from privilege where user_id=? " +
                "and rightstr='administrator'", [result[i].user_id]);
			admin = admin[0].count > 0 ? "管理员" : "普通用户";
			const user_detail = {
				user_id: result[i].user_id,
				nick: result[i].nick,
				solved: result[i].solved,
				submit: result[i].submit,
				reg_time: (new Date(result[i].reg_time).Format("yyyy-MM-dd")),
				privilege: admin
			};
			//console.log(user_detail);
			send_msg.user.push(user_detail);
		}
		res.json(send_msg);
		cache.set(`rank from ${start} to ${end}`, send_msg, 10 * 60);
	}
	else {
		res.json(_detail);
	}
};


router.get("/rank/:start/:end", async function (req, res, next) {
	let start = parseInt(req.params.start);
	let end = parseInt(req.params.end);
	if (isNaN(start) || isNaN(end)) {
		next();
	}
	else {
		await rank_search(req, res, next, start, end);
	}
}, function (req, res) {
	res.json({
		status: "error",
		statement: "invalid rank start or end num"
	});
});

router.get("/rank", function (req, res, next) {
	rank_search(req, res, next, 0, 50);
});

router.get("/:user_id", function (req, res) {
	const user_id = req.params.user_id;
	const _detail = cache.get("user_id" + user_id);
	if (_detail === undefined) {
		query("SELECT submit,solved,email,nick,school from users where user_id=?", [user_id], (rows) => {
			if (rows.length !== 0) {
				const usr = rows[0];
				const user_detail = {
					user_id: user_id,
					submit: usr["submit"],
					solved: usr["solved"],
					email: usr["email"],
					nick: usr["nick"],
					school: usr["school"]
				};
				cache.set("user" + user_id, user_detail, 10);
				res.header("Content-Type", "application/json");
				res.json(user_detail);
			}
			else {

				const obj = {
					status: "ERROR",
					statement: "user not found"
				};
				res.header("Content-Type", "application/json");
				res.json(obj);
			}
		});
	}
	else {
		res.header("Content-Type", "application/json");
		res.json(_detail);
	}
});

router.get("/nick/:nick", function (req, res) {
	const nick = req.params.nick;
	const _user = cache.get("nick" + nick);
	if (_user === undefined) {
		query("SELECT user_id FROM users WHERE nick=?", [nick], (rows) => {
			if (rows.length !== 0) {
				const user = {
					status: "OK",
					user_id: rows[0]["user_id"]
				};
				cache.set("nick" + nick, user, 10);
				res.header("Content-Type", "application/json");
				res.json(user);
			}
			else {
				const obj = {
					status: "ERROR",
					user_id: "null"
				};
				res.header("Content-Type", "application/json");
				res.json(obj);
			}
		});
	}
	else {
		res.header("Content-Type", "application/json");
		res.json(_user);
	}
});

router.get("/:user_id/submit", function (req, res) {
	const user_id = req.params.user_id;
	const _format = cache.get("user_id/submit" + user_id);
	if (_format === undefined) {
		query("SELECT * FROM solution WHERE user_id=?", [user_id], (rows) => {
			let formatArr = [];
			const len = rows.length;
			for (let i = 0; i < len; ++i) {
				let obj = {
					result: rows[i]["result"],
					problem_id: rows[i]["problem_id"]
				};
				formatArr.push(obj);
			}
			res.header("Content-Type", "application/json");
			res.json(formatArr);
		});
	}
	else {
		res.header("Content-Type", "application/json");
		res.json(_format);
	}
});

router.get("/info/:user_id", async function (req, res) {
	const user_id = req.params.user_id;
	const _user_msg = cache.get("user_id/user_info" + user_id);
	if (_user_msg === undefined) {
		let result = await query("select school,email,nick from users where user_id=?", [user_id]);
		if (result.length === 0) {
			res.json({
				status: "error",
				statement: "no such user"
			});
		}
		else {
			let user_info = {
				school: result[0].school,
				email: result[0].email,
				nick: result[0].nick,
				user_id: user_id,
				AC_language: []
			};
			const language = {
				"0": "GCC",
				"21": "GCC",
				"1": "G++",
				"20": "G++",
				"19": "G++",
				"3": "Java",
				"6": "Python",
				"13": "Clang",
				"14": "Clang++",
				"2": "Pascal"
			};
			result = await query("select count(DISTINCT problem_id)as ac from solution where " +
                "user_id=? and result=4", [user_id]);
			user_info["AC"] = parseInt(result[0].ac);
			result = await query("select count(solution_id) as submit from solution where " +
                "user_id=? and problem_id>0", [user_id]);
			user_info["submit"] = parseInt(result[0].submit);
			query("update users set solved=?,submit=? where user_id=?", [user_info.AC, user_info.submit, user_id]);
			result = await query("select language as lang,count(1) as cnt from solution where user_id=? and" +
                " result=4 group by lang order by lang", [user_id]);
			for (let i in result) {
				if (user_info.AC_language[language[result[i].lang]] === undefined)
					user_info.AC_language[language[result[i].lang]] = result[i].cnt;
				else
					user_info.AC_language[language[result[i].lang]] += result[i].cnt;
			}
		}
	}
});

module.exports = router;