import express from "express";
import { error, ok } from "../../module/constants/state";
import ConfigManager from "../../manager/ConfigManager";
const router = express.Router();

function validator(key: any, value?: any, comment?: any) {
	if (typeof key !== "string" || key.length === 0) {
		throw new Error("key should be a valid value");
	}
}

function handleConfigFactory(fn: any) {
	return function (req: any, res: any) {
		try {
			const { key, value, comment } = req.body;
			validator(key, value, comment);
			fn.call(ConfigManager, key, value, comment);
			res.json(ok.ok);
		} catch (e) {
			console.log(e);
			res.json(error.invalidParams);
		}
	};
}

router.get("/config", (req: any, res: any) => {
	res.json(ok.okMaker(ConfigManager.getAllConfig()));
});

router.get("/switch", (req: any, res: any) => {
	res.json(ok.okMaker(ConfigManager.getAllSwitch()));
});

router.post("/config/update", (req: any, res: any) => {
	handleConfigFactory(ConfigManager.setConfig)(req, res);
});

router.post("/switch/update", (req: any, res: any) => {
	handleConfigFactory(ConfigManager.setSwitch)(req, res);
});

router.post("/config/delete", (req: any, res: any) => {
	handleConfigFactory(ConfigManager.removeConfig)(req, res);
});

router.post("/switch/delete", (req: any, res: any) => {
	handleConfigFactory(ConfigManager.removeSwitch)(req, res);
});

module.exports = ["/devconfig", router];
