import express from "express";
import AdminUserService from "../../../service/admin/AdminUserService";
const { error, ok } = require("../../../module/constants/state");
const admin = require("../../../middleware/admin");

const router = express.Router();

router.get("/:page", async (req: any, res: any) => {
	try {
		const page = parseInt(req.params.page);
		if (!isNaN(page)) {
			const data = await AdminUserService.getUserList(page);
			res.json(ok.okMaker(data));
		} else {
			res.json(error.invalidParams);
		}
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

export = ["/list", admin, router];