import { error, ok } from "../../../../../domain/constants/state";
import express from "express";
const router = express.Router();
const admin = require("../../../middleware/admin");
import AdminContestService from "../../../../../application/services/admin/AdminContestService";

router.post("/", async (req: any, res: any) => {
	try {
		await AdminContestService.createContest(req.body, req.session.user_id);
		res.json(ok.ok);
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

module.exports = ["/add", admin, router];
