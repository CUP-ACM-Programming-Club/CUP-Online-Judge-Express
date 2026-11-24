import express from "express";
import AdminUserService from "../../../../../application/services/admin/AdminUserService";
const router = express.Router();
const { trimProperty } = require("../../../../../application/util");
const salt = global.config.salt || "thisissalt";
const [error, ok] = require("../../../../../domain/constants/const_var");

router.post("/modify", async (req: any, res: any) => {
	try {
		const { user_id, password } = trimProperty(req.body);
		await AdminUserService.updateUserPassword(user_id, password, salt);
		res.json(ok.ok);
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

module.exports = ["/password", router];
