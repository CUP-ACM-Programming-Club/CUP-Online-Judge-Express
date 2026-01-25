import express from "express";
import AdminContestService from "../../../service/admin/AdminContestService";
const { error, ok } = require("../../../module/constants/state");
const admin = require("../../../middleware/admin");

const router = express.Router();

router.get("/:page", async (req: any, res: any) => {
	try {
		const page = parseInt(req.params.page);
		if (!isNaN(page)) {
			const data = await AdminContestService.getContestList(page);
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