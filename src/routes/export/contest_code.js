const express = require("express");
const router = express.Router();
const [error] = require("../../module/const_var");
const query = require("../../module/mysql_cache");
const language = require("../../module/const_name").language_name.local;

function checkAdmin(req) {
	return req.session.isadmin;
}

async function getRealUserID(nick) {
	if (typeof nick !== "string") {
		return undefined;
	}
	const data = await query("select user_id from users where nick = ?", [nick.trim()]);
	if (!!data && data.length > 0) {
		for (let el of data) {
			if (!isNaN(el.user_id)) {
				return el.user_id;
			}
		}
		return undefined;
	} else {
		return undefined;
	}
}

async function getCodeSet(contest_id) {
	const data = await query(`select S.user_id,nick,problem_id,result,source,S.language from source_code right join
(select solution_id,problem_id,user_id,result,language,num from solution where contest_id= ?
  and result = 4) S
on source_code.solution_id=S.solution_id
left join users on users.user_id = S.user_id
 order by S.user_id asc,S.num asc`, [contest_id]);

	let nickSet = data.map(el => el.nick);
	nickSet = await Promise.all(nickSet.map(el => getRealUserID(el)));
	for (let i = 0; i < data.length; ++i) {
		data[i].realUserID = nickSet[i];
	}
	return data;
}

function send_file(res, data, contest_id) {
	res.writeHead(200, {
		"Content-Type": "application/file",
		"Content-disposition": `attachment;   filename="logs-${contest_id}.txt"`
	});
	for (let rows of data) {
		if (rows.realUserID) {
			res.write(`学号:${rows.realUserID} 用户名:${rows.user_id} 姓名:${rows.nick}\n\r`);
		} else {
			res.write(`学号:${rows.user_id}  昵称:${rows.nick}\n\r`);
		}
		res.write(`问题:${rows.problem_id} 结果:答案正确 语言:${language[rows.language]}\n\r`);
		res.write("------------------------------------------------------\n\r");
		res.write("AC代码:\n\r");
		res.write(rows.source);
		res.write("\n\r------------------------------------------------------\n\r\n\r");
	}
	res.end();
}

router.get("/:contest_id", async (req, res) => {
	const contest_id = req.params.contest_id;
	if (isNaN(contest_id)) {
		res.json(error.invalidParams);
	} else if (!checkAdmin(req)) {
		res.json(error.noprivilege);
	} else {
		const dataSet = await getCodeSet(contest_id);
		send_file(res, dataSet, contest_id);
	}
});

module.exports = router;