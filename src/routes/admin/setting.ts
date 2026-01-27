import express from "express";
const router = express.Router();
import SettingService from "../../service/admin/SettingService";
const [error, ok] = require("../../module/const_var");
const admin = require("../../middleware/admin");

const baseHandler = async function (req: any, res: any, label: any = []) {
	try {
		res.json(await SettingService.getSetting(label));
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
};

router.get("/", async (req: any, res: any) => {
	await baseHandler(req, res);
});

router.get("/:label", async (req: any, res: any) => {
	await baseHandler(req, res, [req.params.label]);
});

router.post("/", async (req: any, res: any) => {
	try {
		for (let key in req.body) {
			if (req.body.hasOwnProperty(key)) {
				await SettingService.setSetting(key, req.body[key]);
			}
		}
		res.json(ok.ok);
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

module.exports = ["/setting", admin, router];
