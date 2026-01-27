import express from "express";
const router = express.Router();
const [error, ok] = require("../../../module/const_var");
const { trimProperty } = require("../../../module/util");
const UpdatePool = require("../../../module/user/LazyPrivilegeUpdatePool");
import AdminUserService from "../../../service/admin/AdminUserService";

const privilegeList = ["administrator", "source_browser", "contest_manager", "editor"];

// Removed privilegeListGetter

async function modifyHandler(req: any, res: any, action: "add" | "remove") {
	let { user_id, rightstr } = trimProperty(req.body);
	if (privilegeList.includes(rightstr)) {
		try {
			if (action === "add") {
				await AdminUserService.addPrivilege(user_id, rightstr);
			} else {
				await AdminUserService.removePrivilege(user_id, rightstr);
			}
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

router.get("/", async (req: any, res: any) => {
	try {
		res.json(ok.okMaker({ privilegeList, userList: await AdminUserService.getPrivilegeList(privilegeList) }));
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

router.post("/add", async (req: any, res: any) => {
	await modifyHandler(req, res, "add");
});

router.post("/remove", async (req: any, res: any) => {
	await modifyHandler(req, res, "remove");
});

module.exports = ["/privilege", router];
