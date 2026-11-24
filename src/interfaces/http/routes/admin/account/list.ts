import express from "express";
import AdminUserService from "../../../../../application/services/admin/AdminUserService";
const { error, ok } = require("../../../../../domain/constants/state");
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