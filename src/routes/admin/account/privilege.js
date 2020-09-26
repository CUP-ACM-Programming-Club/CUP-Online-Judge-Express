const express = require("express");
const router = express.Router();
const query = require("../../../module/mysql_query");
const [error, ok] = require("../../../module/const_var");
const {trimProperty} = require("../../../module/util");
const UpdatePool = require("../../../module/user/LazyPrivilegeUpdatePool");
const privilegeList = ["administrator", "source_browser", "contest_manager", "editor"];

async function privilegeListGetter() {
	return await query(`select superuser.*, users.nick
from (select user_id, rightstr, defunct
      from privilege
      where rightstr in
            ('${privilegeList.join("','")}')) superuser
         inner join users on users.user_id = superuser.user_id`);
}

async function modifyHandler(req, res, sql) {
	let {user_id, rightstr} = trimProperty(req.body);
	if (privilegeList.includes(rightstr)) {
		try {
			await query(sql, [user_id, rightstr]);
			UpdatePool.addToUpdate(user_id);
			res.json(ok.ok);
		} catch (e) {
			console.log(e);
			res.json(error.database);
		}
	} else {
		res.json(error.invalidParams);
	}
}

router.get("/", async (req, res) => {
	try {
		res.json(ok.okMaker({privilegeList, userList: await privilegeListGetter()}));
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

router.post("/add", async (req, res) => {
	await modifyHandler(req, res, "insert into privilege values(?,?,'N')");
});

router.post("/remove", async (req, res) => {
	await modifyHandler(req, res, "delete from privilege where user_id = ? and rightstr = ?");
});

module.exports = ["/privilege", router];
