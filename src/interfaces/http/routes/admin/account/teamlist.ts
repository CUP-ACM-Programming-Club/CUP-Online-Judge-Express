import express from "express";
const router = express.Router();
const [error, ok] = require("../../../../../domain/constants/const_var");

import AdminUserService from "../../../../../application/services/admin/AdminUserService";

router.get("/", async (req: any, res: any) => {
	try {
		res.json(ok.okMaker(await AdminUserService.getTeamList()));
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

module.exports = ["/teamlist", router];