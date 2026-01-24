import express from "express";
const router = express.Router();
const Setting = require("../../module/admin/setting");
const [error, ok] = require("../../module/const_var");
const admin = require("../../middleware/admin");
const setting = new Setting();

const baseHandler = async function (req: any, res: any, label: any = []) {
	try {
		res.json(await setting.getSetting(label));
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
				await setting.setSetting(key, req.body[key]);
			}
		}
		res.json(ok.ok);
	} catch (e) {
		console.log(e);
		res.json(error.database);
	}
});

module.exports = ["/setting", admin, router];
