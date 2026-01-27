import express from "express";
const router = express.Router();
const [error] = require("../../module/const_var");

const language = require("../../module/const_name").language_name.local;

function checkAdmin(req: any) {
	return req.session.isadmin;
}

import ExportService from "../../service/ExportService";

async function getCodeSet(contest_id: any) {
	return await ExportService.getContestCodeSet(contest_id);
}

function send_file(res: any, data: any, contest_id: any) {
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

router.get("/:contest_id", async (req: any, res: any) => {
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